<script>
	import { onMount } from 'svelte';
	import { gameOptions } from '../../config/gameOptions';

	let winText = '';
	let spinning = false;

	onMount(() => {
		if (import.meta.env.SSR === false) {
			let game;
			class playGame extends Phaser.Scene {
				constructor() {
					super('PlayGame');
				}

				preload() {
					this.load.image('pin', '/images/lucky-spin.png');
				}

				create() {
					let startDegrees = -90;

					// making a graphic object without adding it to the game
					let graphics = this.make.graphics({
						x: 0,
						y: 0,
						add: false
					});

					// adding a container to group wheel and icons
					this.wheelContainer = this.add.container(480 / 2, 480 / 2);

					// array which will contain all icons
					let iconArray = [];

					// looping through each slice
					for (let i = 0; i < gameOptions.slices.length; i++) {
						// converting colors from 0xRRGGBB format to Color objects
						let startColor = Phaser.Display.Color.ValueToColor(gameOptions.slices[i].startColor);
						let endColor = Phaser.Display.Color.ValueToColor(gameOptions.slices[i].endColor);

						for (let j = gameOptions.slices[i].rings; j > 0; j--) {
							// interpolate colors
							let ringColor = Phaser.Display.Color.Interpolate.ColorWithColor(
								startColor,
								endColor,
								gameOptions.slices[i].rings,
								j
							);

							// converting the interpolated color to 0xRRGGBB format
							let ringColorString = Phaser.Display.Color.RGBToString(
								Math.round(ringColor.r),
								Math.round(ringColor.g),
								Math.round(ringColor.b),
								0,
								'0x'
							);

							// setting fill style
							graphics.fillStyle(ringColorString, 1);

							// drawing the slice
							graphics.slice(
								gameOptions.wheelRadius + gameOptions.strokeWidth,
								gameOptions.wheelRadius + gameOptions.strokeWidth,
								(j * gameOptions.wheelRadius) / gameOptions.slices[i].rings,
								Phaser.Math.DegToRad(startDegrees),
								Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees),
								false
							);

							// filling the slice
							graphics.fillPath();
						}

						// setting line style
						graphics.lineStyle(gameOptions.strokeWidth, gameOptions.strokeColor, 0);

						// stroking the slice
						graphics.strokePath();

						// add slice text, if any
						if (gameOptions.slices[i].sliceText != undefined) {
							let text = this.add.text(
								gameOptions.wheelRadius *
									0.75 *
									Math.cos(Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees / 2)),
								gameOptions.wheelRadius *
									0.75 *
									Math.sin(Phaser.Math.DegToRad(startDegrees + gameOptions.slices[i].degrees / 2)),
								gameOptions.slices[i].sliceText,
								gameOptions.slices[i].sliceTextStyle
							);

							// set text origin to its center
							text.setOrigin(0.7);

							// set text angle
							text.angle = startDegrees + gameOptions.slices[i].degrees / 2;

							// add text to iconArray
							iconArray.push(text);
						}

						// updating degrees
						startDegrees += gameOptions.slices[i].degrees;
					}

					// generate a texture called "wheel" from graphics data
					graphics.generateTexture(
						'wheel',
						(gameOptions.wheelRadius + gameOptions.strokeWidth) * 2,
						(gameOptions.wheelRadius + gameOptions.strokeWidth) * 2
					);

					// creating a sprite with wheel image as if it was a preloaded image
					let wheel = this.add.sprite(0, 0, 'wheel');

					// adding the wheel to the container
					this.wheelContainer.add(wheel);

					// adding all iconArray items to the container
					this.wheelContainer.add(iconArray);

					// adding the pin in the middle of the canvas
					this.pin = this.add.sprite(480 / 2, 480 / 2, 'pin');

					// the game has just started = we can spin the wheel
					this.canSpin = true;

					window.addEventListener('spinNow', () =>{
            this.spinWheel()
          });
				}

				spinWheel() {
					if (this.canSpin) {
            spinning = true;
						// the wheel will spin round for some times. This is just coreography
						let rounds = Phaser.Math.Between(
							gameOptions.wheelRounds.min,
							gameOptions.wheelRounds.max
						);

						// then will rotate by a random number from 0 to 360 degrees. This is the actual spin
						let degrees = Phaser.Math.Between(0, 360);

						// then will rotate back by a random amount of degrees
						let backDegrees = Phaser.Math.Between(
							gameOptions.backSpin.min,
							gameOptions.backSpin.max
						);

						// before the wheel ends spinning, we already know the prize
						let prizeDegree = 0;

						// looping through slices
						for (let i = gameOptions.slices.length - 1; i >= 0; i--) {
							// adding current slice angle to prizeDegree
							prizeDegree += gameOptions.slices[i].degrees;

							// if it's greater than the random angle...
							if (prizeDegree > degrees - backDegrees) {
								// we found the prize
								var prize = i;
								break;
							}
						}

						// now the wheel cannot spin because it's already spinning
						this.canSpin = false;

						// animation tweeen for the spin: duration 3s, will rotate by (360 * rounds + degrees) degrees
						// the quadratic easing will simulate friction
						this.tweens.add({
							// adding the wheel container to tween targets
							targets: [this.wheelContainer],

							// angle destination
							angle: 360 * rounds + degrees,

							// tween duration
							duration: Phaser.Math.Between(
								gameOptions.rotationTimeRange.min,
								gameOptions.rotationTimeRange.max
							),

							// tween easing
							ease: 'Cubic.InOut',

							// callback scope
							callbackScope: this,
							// function to be executed once the tween has been completed
							onComplete: function (tween) {
								this.tweens.add({
									targets: [this.wheelContainer],
									angle: this.wheelContainer.angle - backDegrees,
									duration:
										Phaser.Math.Between(
											gameOptions.rotationTimeRange.min,
											gameOptions.rotationTimeRange.max
										) / 2,
									ease: 'Cubic.ease',
									callbackScope: this,
									onComplete: function (tween) {
										winText = gameOptions.slices[prize].text;
                    spinning = false;
										this.canSpin = true;
									}
								});
							}
						});
					}
				}
			}
			let gameConfig = {
				scale: {
					mode: Phaser.Scale.FIT,
					autoCenter: Phaser.Scale.CENTER_BOTH,
					parent: 'roulette-game',
					width: 480,
					height: 480
				},
				transparent: true,
				scene: [playGame]
			};
			const gameScene = new Phaser.Game(gameConfig);
		}
	});

  const onClickHandler = () =>{
    const spinNow = new CustomEvent('spinNow');
    window.dispatchEvent(spinNow);
  }
</script>

<div class="roulette-wrapper">
  <div class="roulette {spinning ? 'spinning' : ''}">
    <div class="roulette__inner" id="roulette-game" />
  </div>
  <div class="information {spinning ? 'hide' : ''}">
    <button type="button" class="close">
      <span />
      <span />
    </button>
    <div class="information__inner">
      {#if winText.length > 0}
        <h2>You win!</h2>
        <p>Congrats, you won <strong>{winText}</strong>. <br> Come back tomorrow  to play again.</p>
        <button type="button" class="btn btn--superslots">Continue</button>
      {:else}
        <h2>Daily spin</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel nisi at elit malesuada
          porta. Mauris lacinia efficitur tortor, vitae vulputate massa volutpat vel.
        </p>
        <button type="button" class="btn btn--superslots" on:click={onClickHandler}>PLAY NOW</button>
      {/if}
    </div>
  </div>
</div>

<style>
	.roulette-wrapper {
		display: flex;
		align-items: center;
    justify-content: center;
    flex-direction: column;
		z-index: 1;
		width: 90%;
	}

  @media screen and (min-width: 660px){
    .roulette-wrapper {
      flex-direction: row;
      width: 80%;
    }
  }

	.roulette {
    width: 90%;
    aspect-ratio: 1/1;
		margin-right: 0;
    margin-bottom: -10rem;
		border-radius: 50%;
		background-color: #52005c;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		background-image: url('/images/lights.svg');
		background-repeat: no-repeat;
		background-size: 99% 99%;
		background-position: center 7px;
    position: relative;
		z-index: 2;
    transition: all .3s ease;
	}

  .roulette.spinning {
    margin-right: 0;
    margin-bottom: -90%;
  }

  @media screen and (min-width: 660px){
    .roulette {
      width: 50%;
      max-width: 35rem;
      margin-right: -15rem;
      margin-bottom: 0;
    }
    .roulette.spinning{
      margin-right: -50%;
      margin-bottom: 0;
    }
  }

	.roulette__inner {
		width: 90%;
		height: 90%;
		border-radius: 50%;
		box-shadow: inset 0px 3px 16px rgba(0, 0, 0, 0.25);
		background-color: #a014b7;
	}

	.information {
		width: 85%;
		height: auto;
		min-height: 300px;
		display: flex;
		flex-direction: column;
		justify-content: end;
		padding: 25% 2rem 2rem 2rem;
		border-radius: 10px;
		background-color: #671f70;
		color: #ffffff;
		position: relative;
    opacity: 1;
    transform: translate(0, 0);
    transition: all .35s ease;
	}

  .information.hide{
    visibility: hidden;
    opacity: 0;
    transform: translate(0, -20%);
  }

	.information__inner {
		max-width: 100%;
	}

  @media screen and (min-width: 660px){
    .information {
      width: 35%;
      min-height: 400px;
		  justify-content: center;
      padding: 2rem 2rem 2rem 20%;
    }

    .information__inner {
      max-width: 80%;
    }

    .information.hide{
      transform: translate(-20%, 0);
    }
  }

	.information__inner > h2 {
		margin-bottom: 1.5rem;
	}

	.information__inner > .btn {
		margin-top: 1.5rem;
	}

	.btn {
		font-size: 1.025rem;
		padding: 0.75rem 1.25rem;
		background: linear-gradient(180deg, rgba(255, 223, 0, 1) 0%, rgba(255, 136, 0, 1) 120%);
		color: #52005c;
		text-transform: uppercase;
		border-radius: 0.25rem;
    width: 100%;
	}
  
  @media screen and (min-width: 660px){
    .btn {
      width: auto;
    }
  }

	.close {
		width: 45px;
		height: 45px;
		position: absolute;
		top: 2rem;
		right: 2rem;
		background-color: transparent;
    display: none;
	}

  @media screen and (min-width: 660px){
    .close {
      display: block;
    }
  }

	.close > span {
		display: inline-block;
		width: 2.5rem;
		height: 0.25rem;
		border-radius: 1rem;
		background-color: #fff;
		transform-origin: center center;
	}

	.close span:first-child {
		transform: rotateZ(45deg) translate(5px, 5px);
	}

	.close span:last-child {
		transform: rotateZ(-45deg) translate(5px, -5px);
	}
</style>
