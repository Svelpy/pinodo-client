<script>
	import { Button } from '#lib/components/ui/index.ts';
	import { redirect } from '#lib/utils/redirect.ts';
</script>

<Button onclick={() => redirect('/auth/sign-in')}>Ir Login</Button>
