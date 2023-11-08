<svelte:options customElement="daily-spin" />

<script>
	import Roulette from '../components/Roulette/Roulette.svelte';
</script>

<div class="main-wrapper">
	<div class="backdrop" />
	<Roulette />
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
</style>