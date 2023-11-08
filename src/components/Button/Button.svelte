<script>
  $: onclickAction = () => console.log('Default action');
</script>

<button type="button" class="btn btn--superslots" on:click={onclickAction}>
  PLAY NOW
</button>

<style>
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
</style>
