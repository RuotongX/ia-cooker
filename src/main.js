import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
       this.resetGameVariables();
    }

    resetGameVariables() {
        // Initialize/reset all game variables
        this.score = 0;
        this.badScore= 0;
        this.timeLeft = 20;
        this.gameStarted = false;
        this.gameEnded = false;
        this.cooker = null;
        this.targets = null;
        this.foods = null;
        this.nextFood = null;
        this.dragStart = { x: 0, y: 0 };
        this.nextFoodImage = null;
        this.scoreText = null;
        this.badScoreText = null;
        this.timeText = null;
        this.gameTimer = null;
        this.targetSpawner = null;
       
        this.stars = []; // Initialize stars array
    }

    preload() {
        // 加载游戏资源
        this.load.image('cooker', 'assets/cooker.png');
        this.load.image('customer-wait', 'assets/customer-wait.png');
        this.load.image('food', 'assets/food.png');
        this.load.image('shit','assets/shit.png');
        this.load.image('customer-satisfied', 'assets/customer-satisfied.png');
        this.load.image('customer-disappointed', 'assets/customer-disappointed.png');
        this.load.image('qq-group', 'assets/qq-group.jpg');

        // 创建星空背景
        this.load.image('starfield', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }

    create() {
        this.resetGameVariables();
        // 创建星空背景
        this.createStarfield();
        
        // 创建发射器
        this.cooker = this.add.image(this.cameras.main.width / 2, this.cameras.main.height - 150, 'cooker');
        this.cooker.setScale(0.3);

        // 创建下一个食物的预览图
        this.dependNextFood();
        

        // 创建物理组
        this.targets = this.physics.add.group();
        this.foods = this.physics.add.group();
        
        // 设置物理世界重力
        this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.physics.world.gravity.y = 300; // Match this value with the one in drawTrajectory
        this.physics.world.enable = true;
        
        
        // 创建UI
        this.createUI();
        
        // 设置输入事件
        this.setupInput();
        
        // 开始游戏
        this.startGame();
        
        // 碰撞检测
        this.physics.add.overlap(this.foods, this.targets, this.hitTarget, null, this);
    }

    createStarfield() {
        // Create dark background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000011).setOrigin(0, 0);
        
        // Create stars with varying depths and speeds
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const speed = Phaser.Math.FloatBetween(0.1, 0.5);
            
            const star = this.add.circle(x, y, size, 0xffffff);
            star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
            star.speed = speed;
            
            this.stars.push(star);
        }
    }

    createUI() {
        // 分数显示
        this.scoreText = this.add.text(20, 20, '吃饱了: 0', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });

        this.badScoreText = this.add.text(20, 60, '臭昏了: 0', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // 时间显示
        this.timeText = this.add.text(20, 100, '时间: 20', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        this.add.text(20, 180, '欢迎加入IA吧QQ群谢谢喵', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        this.add.text(20, 220, '112471442', {
            fontSize: '18px',  
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        this.add.image(20, 260, 'qq-group').setScale(0.15).setOrigin(0, 0);
        //指示器显示
        this.add.text(this.cameras.main.width / 2-200, this.cameras.main.height - 180, '下一个食物：', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 操作提示
        this.add.text(this.cameras.main.width / 2, 30, '点击屏幕释放食物！小心答辩！', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
    }

    setupInput() {
        // 鼠标/触摸输入
        this.input.on('pointerdown', this.onPointerDown, this);
        
    }

    startGame() {
        this.gameStarted = true;
        
        // Initial target spawn
        this.spawnTarget();
        
        // Create target spawner timer - new target every 0.5 seconds
        this.targetSpawner = this.time.addEvent({
            delay: 1000,  // 0.5 seconds
            callback: this.spawnTarget,
            callbackScope: this,
            loop: true
        });
        
        // 开始计时器
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    spawnTarget() {
        if (this.gameEnded) return;
        
        // Limit the maximum number of targets (optional, prevents too many targets)
        if (this.targets.countActive() > 15) return;
        
        // Random position within reachable range
        const x = Phaser.Math.Between(100, this.cameras.main.width - 100);
        const y = Phaser.Math.Between(100, this.cameras.main.height - 200);
        
        // Create target with fade-in animation
        const target = this.physics.add.image(x, y, 'customer-wait');
        target.setScale(0.6);
        target.alpha = 0; // Start invisible
        target.body.setImmovable(true);
        
        this.targets.add(target);
        
        // Add fade-in animation
        this.tweens.add({
            targets: target,
            alpha: 1,
            duration: 200,
            ease: 'Linear'
        });
        
        // Target lifetime
        // this.time.delayedCall(4000, () => {
        //     if (target && target.active) {
        //         // Add fade-out before destruction
        //         this.tweens.add({
        //             targets: target,
        //             alpha: 0,
        //             duration: 200,
        //             ease: 'Linear',
        //             onComplete: () => {
        //                 target.destroy();
        //             }
        //         });
        //     }
        // });
    }

    dependNextFood() {
      this.nextFoodImage?.destroy(); // 清理之前的食物预览图
      if (Math.random() < 0.8) {
        this.nextFood = "food";
      } else {
        this.nextFood ="shit";
      }
      this.nextFoodImage = this.add.image(this.cameras.main.width / 2-200, this.cameras.main.height - 120, this.nextFood);
      this.nextFoodImage.setScale(0.5);
    }

    onPointerDown(pointer) {
        if (!this.gameStarted || this.gameEnded) return;
        this.dragStart.x = pointer.x;
        this.dragStart.y = pointer.y;
        this.shootFood(pointer);
       
        
    }




  shootFood(pointer) {
    const startX = this.dragStart.x;
    const startY = this.dragStart.y;
    const bullet = this.nextFood;

    const food = this.physics.add.image(startX, startY, bullet);

    food.setScale(0.5);
    
  
    this.foods.add(food);
    this.dependNextFood(); // Prepare next food type

    
    // 清理超出屏幕的食物
    this.time.delayedCall(5000, () => {
        if (food && food.active) {
            food.destroy();
        }
    });
  }

    hitTarget(food, target) {
        // 击中目标
        
        food.destroy();
        target.destroy();
        
       
        
        // 生成新目标
        this.spawnTarget();
        
        // 播放击中效果（可以添加粒子效果)
        if(food.texture.key === "food"){
           this.score += 1;
        this.scoreText.setText('吃饱了: ' + this.score);
          const effect = this.add.sprite(target.x, target.y, 'customer-satisfied');
          effect.setOrigin(0.5);
          effect.setScale(0.6);
        
          effect.play('satisfied-animation');
          if (this.anims.exists('satisfied-animation')) {
              effect.play('satisfied-animation');
          }

          // Add fade-out animation and remove sprite when done
          this.tweens.add({
              targets: effect,
              alpha: 0,
              duration: 500, // 500ms = 0.5s
              ease: 'Linear',
              delay: 300, // Optional: show the sprite for a moment before fading
              onComplete: () => {
                  effect.destroy();
              }
          });
        } else{
          this.badScore += 1;
          this.badScoreText.setText('臭昏了: ' + this.badScore);
          const effect = this.add.sprite(target.x, target.y, 'customer-disappointed');
          effect.setOrigin(0.5);
          effect.setScale(0.6);
          effect.play('disappointed-animation');
          if (this.anims.exists('disappointed-animation')) {
              effect.play('disappointed-animation');
          }

          // Add fade-out animation and remove sprite when done
          this.tweens.add({
              targets: effect,
              alpha: 0,
              duration: 500, // 500ms = 0.5s
              ease: 'Linear',
              delay: 300, // Optional: show the sprite for a moment before fading
              onComplete: () => {
                  effect.destroy();
              }
          });
        }
    }

    updateTimer() {
        this.timeLeft--;
        this.timeText.setText('时间: ' + this.timeLeft);
        
        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    endGame() {
        this.gameEnded = true;
        
        // Stop all timers
        if (this.gameTimer) this.gameTimer.destroy();
        if (this.targetSpawner) this.targetSpawner.destroy();
        
        // 清理所有对象
        this.targets.clear(true, true);
        this.foods.clear(true, true);
       
        
        // 显示游戏结束界面
        const gameOverBg = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            400, 200, 0x000000, 0.8
        );
        
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 30, '游戏结束!', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 10, '你喂饱了' + this.score+"个初音未来", {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 40, '你臭昏了' + this.badScore+"个初音未来", {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 70, '点击重新开始', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // 重启游戏
        this.input.once('pointerdown', () => {
          
            this.scene.restart();
        });
    }

    update(time, delta) {
        // Update starfield
        if (this.stars) {
            for (let i = 0; i < this.stars.length; i++) {
                const star = this.stars[i];
                star.y += star.speed;
                
                // Reset stars that move off screen
                if (star.y > this.cameras.main.height) {
                    star.y = 0;
                    star.x = Phaser.Math.Between(0, this.cameras.main.width);
                }
            }
        }
        
        // Other update logic...
    }
}

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: "98%",
        height: "98%",
        parent: 'game-container',
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: GameScene
};

const game = new Phaser.Game(config);