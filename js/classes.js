class Sprite{
    constructor({position,imageSrc,scale=1,framesMax=1,offset={x:0,y:0}}){
        this.position=position
        this.height=150;
        this.width=50;
        this.image=new Image()
        this.image.src=imageSrc
        this.scale=scale
        this.framesMax= framesMax
        this.framecurrent=0
        this.framesElapsed=0
        this.frameshold=30
        this.offset=offset
    }
    draw(){
        c.drawImage(this.image,
            this.framecurrent*(this.image.width/this.framesMax),
            0,
            this.image.width/this.framesMax,
            this.image.height,
            this.position.x-this.offset.x,
            this.position.y-this.offset.y,
            (this.image.width/this.framesMax)*this.scale,
            this.image.height*this.scale)
    }
    update(){
        this.draw();
        this.framesElapsed++;
        if(this.framesElapsed%this.frameshold===0){
        if(this.framecurrent<this.framesMax-1){
        this.framecurrent++;}
        else{
            this.framecurrent=0;
        }
    }}
    animateframes(){
                this.framesElapsed++;
        if(this.framesElapsed%this.frameshold===0){
        if(this.framecurrent<this.framesMax-1){
        this.framecurrent++;
    }
        else{
            this.framecurrent=0;
        }
    }
    }
}
    
class Fighter extends Sprite {
    constructor({position,velocity,height,color = 'red',offset,imageSrc,scale=1,framesMax=1,sprites,
        attackBox={
            offset:{},width:undefined,height:undefined}
        }
    ){
        
        super({
            position,
            imageSrc,
            scale,
            framesMax,
            offset
        })
        this.velocity=velocity;
        this.height=150;
        this.width=50;
        this.lastKey
        this.attackBox = {
            position:{
                x:this.position.x,
                y:this.position.y
            },
            offset:attackBox.offset,
            width:attackBox.width,
            height:attackBox.height
        }
        this.health=100
        this.framecurrent=0
        this.framesElapsed=0
        this.frameshold=15
        // this.position=position
        this.color=color
        this.isAttacking
        this.sprites=sprites;
        this.dead=false
        for(const sprite in this.sprites){ 
            this.sprites[sprite].image=new Image();
            this.sprites[sprite].image.src=this.sprites[sprite].imageSrc;
        }
    }

    update(){
        this.draw();
        if(!this.dead){
        this.animateframes();
    }
        this.attackBox.position.x=this.position.x-this.attackBox.offset.x;
        this.attackBox.position.y=this.position.y-this.attackBox.offset.y;
        
        //attack box drawn
        // c.fillRect(this.attackBox.position.x,this.attackBox.position.y,this.attackBox.width,this.attackBox.height)

        this.position.x+=this.velocity.x;
        this.position.y+=this.velocity.y;
        
        if(this.position.y+this.height+this.velocity.y >= canvas.height-96){
            this.velocity.y=0;
            this.position.y=330;
        }
        else{
            this.velocity.y += gravity;
        }
    }
    attack() {
        this.isAttacking=true;
        this.switchsprite('attack1');
        setTimeout(()=>{
            this.isAttacking=false;
        },1000);
    }
takeHit(){
    this.health-=20;
    if(this.health<=0){
        this.switchsprite('death');
        setTimeout(()=>{
            success.play();
            success.volume=0.3;
        },1000);
    }
    else{
        this.switchsprite('takeHit');
    }
}
        switchsprite(sprite) {
            if(this.image===this.sprites.death.image){
                if(this.framecurrent===this.sprites.death.framesMax-1){
                this.dead=true}
                return 
            }
            if(this.image===this.sprites.attack1.image&&
                this.framecurrent<this.sprites.attack1.framesMax-1)
                 {
                    return
                 } 
     
                 if(this.image===this.sprites.takeHit.image && this.framecurrent < this.sprites.takeHit.framesMax-1){
                    return  
                 }
                 
            switch(sprite){
            case 'idle':
                if(this.image!=this.sprites.idle.image){
                    this.image=this.sprites.idle.image;
                this.framesMax=this.sprites.run.framesMax;
                    this.framecurrent=0;
                }
                break;
            case 'run':
            if(this.image!=this.sprites.run.image){
            
            this.image=this.sprites.run.image; 
            this.framesMax=this.sprites.run.framesMax;
            this.framecurrent=0;
        }   


            break;
            case 'jump':
            if(this.image!=this.sprites.jump.image){
            this.image=this.sprites.jump.image;
            this.framesMax=this.sprites.jump.framesMax;
                this.framecurrent=0
            } 
            break;
            case 'fall':
              if(this.image!=this.sprites.fall.image){
            this.image=this.sprites.fall.image;
            this.framesMax=this.sprites.fall.framesMax;
                
            this.framecurrent=0
            }   
            break;
            case 'attack1':
              if(this.image!=this.sprites.attack1.image){
            this.image=this.sprites.attack1.image;
            this.framesMax=this.sprites.attack1.framesMax;
            this.framecurrent=0
            }   
            break;
            case 'takeHit':
              if(this.image!=this.sprites.takeHit.image){
            this.image=this.sprites.takeHit.image;
            this.framesMax=this.sprites.takeHit.framesMax;
                this.framecurrent=0
            }   
            break;
            case 'death':
                 if(this.image!=this.sprites.death.image){
            this.image=this.sprites.death.image;
            this.framesMax=this.sprites.death.framesMax;
                this.framecurrent=0;
                 }
            break;
            default:

                break;
        }
    }
    }

