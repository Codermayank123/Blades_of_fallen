const canvas=document.querySelector('canvas');
const c=canvas.getContext('2d');
canvas.width=1024;
canvas.height=576;

const success=new Audio('./audio/success.wav');
const attackP=new Audio('./audio/attackP.mp3');
const attackW=new Audio('./audio/attackW.mp3');
const hurt=new Audio('./audio/hurt.wav');
const jump=new Audio('./audio/jump.wav');
const death=new Audio('./audio/death.mp3');
// const backgroundMusic=new Audio('./audio/background.mp3');

success.preload="auto";
attackP.preload="auto";
attackW.preload="auto";
hurt.preload="auto";
jump.preload="auto";
death.preload="auto";

const backgroundMusic = new Audio('./audio/background.mp3');
backgroundMusic.preload="auto";
backgroundMusic.loop = true;
backgroundMusic.volume = 1.0; 
backgroundMusic.currentTime = 2;
backgroundMusic.muted = true;

// Start music when game begins
const startMusic = () => {
    backgroundMusic.muted = false;
    backgroundMusic.play();
    document.removeEventListener("click", startMusic);
    document.removeEventListener("keydown", startMusic);
};

// Start music on first user interaction
document.addEventListener("click", startMusic);
document.addEventListener("keydown", startMusic);

c.fillRect(0,0,canvas.width,canvas.height)
const gravity=0.6;
const background=new Sprite({
    position:{
        x:0,
        y:0
    },
    imageSrc:'./img/background.png'
})


const shop=new Sprite({
    position:{
        x:600,
        y:135
    },
    imageSrc:'./img/shop.png',
    scale:2.7,
    framesMax:6,
})




const player= new Fighter({
    position:{
    x:200,
    y:0
},
velocity:{
    x:0,
    y:0
},
offset:{
    x:0,
    y:0
},
    imageSrc:'./Sprites/Idle.png',
    framesMax:8,
    scale: 2.4,
    offset:{
        x:215,
        y:140
    },
    sprites:{
        idle:{
             imageSrc:'./Sprites/Idle.png',
            framesMax:8
            },
        run:{
            imageSrc:'./Sprites/Run.png',
            framesMax:8,
            image: new Image()
        },
        jump:{
            imageSrc:'./Sprites/Jump.png',
            framesMax:2,
        },
        fall:{
            imageSrc:'./Sprites/Fall.png',
            framesMax:2,
        },
        attack1:{
        imageSrc:'./Sprites/Attack1.png',
            framesMax:6    
        },
        takeHit:{
        imageSrc:'./Sprites/Take Hit - white silhouette.png',
        framesMax:4
        },
        death:{
            imageSrc:'./Sprites/Death.png',
            framesMax:6
        }   
    },
    attackBox:{
        offset:{
            x:-60,
            y:-50
        },
        width:170,
        height:50
    }
})
const enemy=new Fighter({
    position:{
    x:700,
    y:100}
    ,
    velocity:{
        x:0,
        y:0
    },
    offset:{
        x:50,
        y:0
    },
    color: 'blue',
    imageSrc:'./Sprites2/Idle.png',
    framesMax:8,
    scale: 2.4,
    offset:{
        x:215,
        y:250
    },
    sprites:{
        idle:{
             imageSrc:'./Sprites2/Idle.png',
            framesMax:8
            },
        run:{
            imageSrc:'./Sprites2/Run.png',
            framesMax:8,
            image: new Image()
        },
        jump:{
            imageSrc:'./Sprites2/Jump.png',
            framesMax:2,
        },
        fall:{
            imageSrc:'./Sprites2/Fall.png',
            framesMax:2,
        },
        attack1:{
        imageSrc:'./Sprites2/Attack1.png',
            framesMax:8    
        },
        takeHit:{
        imageSrc:'./Sprites2/Take hit.png',
        framesMax:3
    },
           death:{
            imageSrc:'./Sprites2/death.png',
            framesMax:7
        }   

    },
    attackBox:{
        offset:{
            x:100,
            y:-50
        },
        width:180,
        height:50
    }
})
console.log(player);

const keys ={
    a:{
        pressed:false
    },
    d:{
        pressed:false
    },
    w:{
        pressed:false
    }
    ,
    ArrowRight:{
        pressed:false
    },
    ArrowLeft:{
        pressed:false
    }
}

let lastKey;

 decreaseTimer();
function animate(){
    window.requestAnimationFrame(animate)
    c.fillStyle='black';
    c.fillRect(0,0,canvas.width,canvas.height);
    background.update();
shop.update();
c.fillStyle='rgba(255, 255, 255, 0.08)';
c.fillRect(0,0,canvas.width,canvas.height)
player.update();
enemy.update(); 
player.velocity.x=0;
    //player movement
    if(keys.a.pressed && player.lastKey === 'a'){
        player.velocity.x=-4;
        player.switchsprite('run');
    } 
    else if(keys.d.pressed && player.lastKey === 'd'){
        player.velocity.x=4
        player.switchsprite('run');
    }
    else{
    player.switchsprite('idle');
    }
     if(player.velocity.y<0){
         player.switchsprite('jump');
    }
    else if(player.velocity.y>0){
        player.switchsprite('fall');
    }

    enemy.velocity.x=0;
    if(keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft'){
        enemy.velocity.x=-4;
        enemy.switchsprite('run');
    } 
    else if(keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight'){
        enemy.velocity.x=4
        enemy.switchsprite('run');
    }
    else{
    enemy.switchsprite('idle');
    }
     if(enemy.velocity.y<0){
        enemy.switchsprite('jump');        
    }
    else if(enemy.velocity.y>0){
        enemy.switchsprite('fall');
    }
        
    //detect for collision
    if(rectangularCollisio({rec1:player,rec2:enemy})&&player.isAttacking && player.framecurrent===4){
        enemy.takeHit(); 
        // enemy.switchsprite('takeHit');
        player.isAttacking=false;
        // document.getElementById("e   nemyHealth").style.width=;
        gsap.to('#enemyHealth',{
            width:enemy.health+'%'
        })
        hurt.currentTime=0.3
        hurt.play();
        hurt.volume=1;
        
    }
 //if player misses
    if(player.isAttacking&&player.framecurrent===4){
        player.isAttacking=false;
    }

    else if(rectangularCollisio({rec1:enemy,rec2:player})&&enemy.isAttacking && enemy.framecurrent==4
    ){
        player.takeHit();
        // document.getElementById("playerHealth").style.width=player.health+'%';
        enemy.isAttacking=false;
        gsap.to('#playerHealth',{
            width:player.health+'%'
        })
        hurt.currentTime=0.3;
        hurt.play();
        hurt.volume=10;
    }
    
    if(enemy.isAttacking&&enemy.framecurrent===4){
        enemy.isAttacking=false;
    }


//
if(enemy.health<=0||player.health<=0){
    victory({player,enemy});
    timer = 0;
    
    // Stop background music
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    
    // Show restart button after a delay
    setTimeout(() => {
        const restart = document.querySelector("#btn");
        if(restart) {
            restart.style.visibility = "visible";
            restart.onclick = () => {
                location.reload();
            };
        }
    }, 2000);
}    // enmy.attackBox.position.x+enemy.attackBox.width>=player.position.x){

}
animate();
window.addEventListener('keydown',(event)=>{
    if(!player.dead){
    
    switch(event.key){
        case 'd':
        keys.d.pressed=true;
        player.lastKey = 'd';    
        break
        
        case 'a':
        keys.a.pressed=true;
        player.lastKey = 'a';
        break;

        case 'w':
            player.velocity.y=-20;
           jump.currentTime=0.15
        jump.play();
            jump.volume=20
        break;
    
        case ' ':
        player.attack();
        attackP.currentTime=0
        attackP.play();
        attackP.volume=0.2

        break;
    }
}
if(!enemy.dead){
    switch(event.key){
         case 'ArrowRight':
        keys.ArrowRight.pressed=true;
        enemy.lastKey = 'ArrowRight';    
        break
        
        case 'ArrowLeft':
        keys.ArrowLeft.pressed=true;
        enemy.lastKey = 'ArrowLeft';
        break;

        case 'ArrowUp':
            enemy.velocity.y=-20;
               jump.currentTime=0.15
        jump.play();
        jump.volume=20
        
        break;
        case 'ArrowDown':
        enemy.attack();
        attackW.currentTime=1
        attackW.play();
        attackW.volume=0.5
        break;
    }
}
    console.log(event.key);
})
window.addEventListener('keyup',(event)=>{
    switch(event.key){
        case 'd':
        keys.d.pressed=false;
        break
        case 'a':
        keys.a.pressed=false;
        break;
        
        case 'ArrowRight':
        keys.ArrowRight.pressed=false;
        break
        case 'ArrowLeft':
        keys.ArrowLeft.pressed=false;
        break;
        
    }
    console.log(event.key);
})