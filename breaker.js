const TEXTURE_BACKGROUND = new Image();
TEXTURE_BACKGROUND.src = "https://jooinn.com/images/simple-starry-space-background.jpg";

const TEXTURE_BREAKER = new Image();
TEXTURE_BREAKER.src = "block.png";

let currentMap = 0;

class Color{
    constructor(red = 0, green = 0, blue = 0, alpha = 1){
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha
    }
}

class GameObject{

    constructor(x, y, width, height, texture, color = new Color(0,0,255)){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.texture = texture;
        this.color = color;
    }

    tick(instance){

    }

    render(instance, g){
        if(!this.texture){
            instance.setColor(this.color.red, this.color.green, this.color.blue);
            g.fillRect(this.x, this.y, this.width, this.height);
        }else{
            g.drawImage(this.texture, this.x, this.y, this.width, this.height);
        }
    }

    getCollision(){
        for(let i = 0; i < objects.length; i++){
            if(objects[i] && objects[i] != this){
                if(this.x + this.width > objects[i].x && this.x < objects[i].x + objects[i].width){
                    if(this.y + this.height > objects[i].y && this.y < objects[i].y + objects[i].height){
                        return i;
                    }
                }
            }
        }
        return null;
    }

}

class Breakable extends GameObject {
    constructor(x, y, width, height, color){
        super(x, y, width, height, TEXTURE_BREAKER, color);
    }

    render(instance,g){
        instance.setColor(this.color.red, this.color.green, this.color.blue);
        g.fillRect(this.x, this.y, this.width, this.height);
        super.render(instance,g);
    }
}

class Player extends GameObject {
    
    constructor(){
        super();
        this.speed = 8;
    }

    tick(instance){
        if(keyboard["ArrowLeft"]){
            if(this.x > this.speed){
                this.x -= this.speed;
            }
        }
        if(keyboard["ArrowRight"]){
            if(this.x + this.width < canvas.width-this.speed){
                this.x += this.speed;
            }
        }

        if(keyboard["p"]){
            ball = new Ball();
            ball.color = new Color(255,255,255);
            ball.width = 16;
            ball.height = 16;
            ball.x = player.x + player.width/2 - ball.width/2;
            ball.y = player.y - player.height;
            objects.push(ball);
            keyboard["p"] = false;
        }
    }

}

class Ball extends GameObject {

    constructor(){
        super();
        this.velocityX = 1;
        this.velocityY = -1;
        this.speed = 5;
    }

    tick(instance){
        super.tick(instance);
        
        this.x += this.velocityX*this.speed;        
        let col = this.getCollision();
        if(col){
            this.velocityX = -this.velocityX;
            if(objects[col] instanceof Breakable){
                objects.splice(col, 1);
                check();
            }
            this.x += this.velocityX*this.speed;
        }
        
        this.y += this.velocityY*this.speed;
        col = this.getCollision();
        if(col){
            this.velocityY = -this.velocityY;
            if(objects[col] instanceof Breakable){
                objects.splice(col, 1);
                check();
            }else{
                let delta = this.x + (this.width/2) - player.x;
                let mod = (delta/player.width)-0.5;
                this.velocityX = this.speed * mod;
            }
            this.y += this.velocityY*this.speed;
        }

        if(this.x + this.width > canvas.width){
            this.velocityX = -this.velocityX;
        }

        if(this.x < 0){
            this.velocityX = -this.velocityX;
        }

        if(this.y < 0){
            this.velocityY = -this.velocityY;
        }

        if(this.y + this.height > canvas.height){
            for(let i = 0; i < objects.length; i++){
                if(objects[i] == this){
                    objects.splice(i, 1);
                }
            }
            let contains = false;
            for(let i = 0; i < objects.length; i++){
                if(objects[i] instanceof Ball){
                    contains = true;
                }
            }
            if(!contains){
                gameOver();
            }
        }

    }

    render(instance, g){
        setColor(150,150,150);
        g.fillRect(this.x-2, this.y-2, this.width+4, this.height+4);
        super.render(instance,g);
    }

}

const canvas = document.getElementById("view");
const g = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 720;

let keyboard = [];

window.addEventListener("keydown", function(e){
    keyboard[e.key] = true;
});

window.addEventListener("keyup", function(e){
    keyboard[e.key] = false;
});

let player = null;
let objects = [];

function setColor(red, green, blue, alpha = 1){
    g.fillStyle = "rgba(" + red + "," + green + "," + blue + "," + alpha +")";
}

function clear(){
    g.fillRect(0,0,canvas.width,canvas.height);
}

init();
setInterval(loop,(1000/60));

function check(){
    let found = false;
    for(let i = 0; i < objects.length; i++){
        if(objects[i] instanceof Breakable){
            found = true;
        }
    }
    if(!found){
        currentMap++;
        loadMap(currentMap)
    }
}

function gameOver(){
    loadMap(currentMap);
}

function loadMap(number){
    objects = [];

    let request = new XMLHttpRequest();
    request.open("GET", "map_" + number + ".txt", false);
    request.send();
    let content = request.response;
    let lines = content.split("\r\n");
    
    let colors = [];
    let defaultColor;

    let meta = lines[0].split(";");
    for(let i = 0; i < meta.length-1; i++){
        let args = meta[i].split("=");
        let rgb = args[1].split(",");
        let red = parseInt(rgb[0]);
        let green = parseInt(rgb[1]);
        let blue = parseInt(rgb[2]);
        if(args[0] == "d"){
            defaultColor = new Color(red, green, blue);
        }else{
            colors[args[0]] = new Color(red, green, blue);
        }
    }

    let colorBuffer = lines[1].split("");
    
    for(let i = 2; i < lines.length; i++){
        let blocks = lines[i].split("");
        for(let c = 0; c < blocks.length; c++){
            let color = colors[colorBuffer[0]];
            if(!color){
                color = defaultColor;
            }
            addBlock(c, i-2, blocks[c], color);
            colorBuffer.shift();
        }
    }

    player = new Player();
    player.color = new Color(255,255,255);
    player.texture = TEXTURE_BREAKER;
    player.width = 148;
    player.height = 20;
    player.x = canvas.width/2 - player.width/2;
    player.y = canvas.height - player.height;
    objects.push(player);

    ball = new Ball();
    ball.color = new Color(255,255,255);
    ball.width = 16;
    ball.height = 16;
    ball.x = player.x + player.width/2 - ball.width/2;
    ball.y = player.y - player.height;
    objects.push(ball);

}

function addBlock(column, row, type, color){
    let object = new Breakable(column * 125 + 15, row * 45 + 10, 120, 35, color);
    objects.push(object);
}

function loop(){
    setColor(0,0,0)
    clear();

    tick();
    render();
}

function init(){
    loadMap(0);
}

function tick(){
    for(let i = 0; i < objects.length; i++){
        if(objects[i]){
            objects[i].tick(this);
        }
    }
}

function render(){
    g.drawImage(TEXTURE_BACKGROUND,0,0,canvas.width,canvas.height);
    for(let i = 0; i < objects.length; i++){
        if(objects[i]){
            objects[i].render(this,g);
        }
    }
}