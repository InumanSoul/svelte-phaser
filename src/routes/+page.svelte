<script>
	import { onMount } from 'svelte';
	import { gameOptions } from '../config/gameOptions';

	let winText = '';

	onMount(() => {
		if (import.meta.env.SSR === false) {
			let game;
			class playGame extends Phaser.Scene {
				constructor() {
					super('PlayGame');
				}

				preload() {
					// loading pin image
					this.load.image('pin', '/images/pin.png');
				}

				create() {
					// starting degrees
					let startDegrees = -90;

					// making a graphic object without adding it to the game
					let graphics = this.make.graphics({
						x: 0,
						y: 0,
						add: false
					});

					// adding a container to group wheel and icons
					this.wheelContainer = this.add.container(600 / 2, 600 / 2);

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
							// the text
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
					this.pin = this.add.sprite(600 / 2, 600 / 2, 'pin');

					// the game has just started = we can spin the wheel
					this.canSpin = true;

					// waiting for your input, then calling "spinWheel" function
					this.input.on('pointerdown', this.spinWheel, this);
				}

				spinWheel() {
					// can we spin the wheel?
					if (this.canSpin) {
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
								// another tween to rotate a bit in the opposite direction
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
										const eventData = {
											text: gameOptions.slices[prize].text
										};
										const winEvent = new CustomEvent('winEvent', {
											detail: eventData,
											bubbles: false,
											cancelable: false
										});
										window.dispatchEvent(winEvent);
										// window.alert('You win' + gameOptions.slices[prize].text)
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
					width: 600,
					height: 600
				},
				transparent: true,
				scene: [playGame]
			};
			const gameScene = new Phaser.Game(gameConfig);
		}

    window.addEventListener('winEvent', (e) => {
      winText = e.detail.text
    });
	});
</script>

<div class="main-wrapper">
	<div class="backdrop" />
	<div class="roulette-wrapper">
		<div class="roulette">
			<div class="roulette__inner" id="roulette-game" />
		</div>
		<div class="information">
			<button type="button" class="close">
				<span />
				<span />
			</button>
			<div class="information__inner">
				<h2>Daily spin</h2>
				{#if winText.length > 0}
					<div class="prize-text">{winText}</div>
				{/if}
				<p>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel nisi at elit malesuada
					porta. Mauris lacinia efficitur tortor, vitae vulputate massa volutpat vel.
				</p>
				<button type="button" class="btn btn--superslots">PLAY NOW</button>
			</div>
		</div>
	</div>
</div>

<style>
	.main-wrapper {
		width: 100dvw;
		height: 100dvh;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
	}

	.backdrop {
		background-color: rgba(0, 0, 0, 0.5);
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
	}

	.roulette-wrapper {
		display: flex;
		align-items: center;
		z-index: 1;
		max-width: 80%;
	}

	.roulette {
		width: 35rem;
		height: 35rem;
		margin-right: -15rem;
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
		z-index: 2;
	}

	.roulette__inner {
		width: 90%;
		height: 90%;
		border-radius: 50%;
		box-shadow: inset 0px 3px 16px rgba(0, 0, 0, 0.25);
		background-color: #a014b7;
	}

	.information {
		width: 40%;
		height: auto;
		min-height: 400px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 2rem 2rem 2rem 25%;
		border-radius: 10px;
		background-color: #671f70;
		color: #ffffff;
		position: relative;
	}

	.information__inner {
		max-width: 60%;
	}

	.information__inner > h2 {
		margin-bottom: 1rem;
	}

	.information__inner > .btn {
		margin-top: 1rem;
	}

	.btn {
		font-size: 1.025rem;
		padding: 0.75rem 1.25rem;
		background: linear-gradient(180deg, rgba(255, 223, 0, 1) 0%, rgba(255, 136, 0, 1) 120%);
		color: #52005c;
		text-transform: uppercase;
		border-radius: 0.25rem;
	}

	.close {
		width: 45px;
		height: 45px;
		position: absolute;
		top: 2rem;
		right: 2rem;
		background-color: transparent;
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
