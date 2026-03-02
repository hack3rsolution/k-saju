import { Redirect } from 'expo-router';

// Root redirect — auth guard will push to (onboarding) or (tabs)
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
