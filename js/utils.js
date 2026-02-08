function rectangularCollisio({rec1,rec2}){
        return rec1.attackBox.position.x+rec1.attackBox.width>=rec2.position.x&&
        rec1.attackBox.position.x<=rec2.position.x+rec2.width&&
        rec1.attackBox.position.y+rec1.attackBox.height >= rec2.attackBox.position.y
        && rec1.attackBox.position.y <= rec2.position.y+rec2.height&&
        rec1.isAttacking
}

function victory({
    player,enemy
}){

   if(player.health===enemy.health){
       document.getElementById("msg").innerText="It's a tie";
       document.getElementById("msg").style.display='flex';
    }
    else if(player.health>enemy.health){
    document.getElementById("msg").innerText="Player1 Won!!!!!";
    document.getElementById("msg").style.display='flex';
    }
    else{
        document.getElementById("msg").innerText="Player2 Won!!!!";
       document.getElementById("msg").style.display='flex';
    
    }
}

let timerv=60;
 function decreaseTimer(){
   let timer=document.getElementById("timer");
   if(timerv>0){
            setTimeout(decreaseTimer,1000)
            timerv--;
            timer.innerHTML=timerv;
            // timer.innerText=0;
   }
    if(timerv===0){
    victory({player,enemy})        
    }    
}
