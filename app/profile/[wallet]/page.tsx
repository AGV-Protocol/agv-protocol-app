import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAddress } from '@thirdweb-dev/react';
import { Button, Input, Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const formSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Invalid email address')
});

export default function Profile({ params }: { params: { wallet: string } }) {
  const address = useAddress();
  const router = useRouter();
  const [profile, setProfile] = useState({ username: '', email: '', wallet: params.wallet });
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', email: '' }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, 'kols', params.wallet);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && typeof data.username === 'string' && typeof data.email === 'string') {
          setProfile({ username: data.username, email: data.email, wallet: params.wallet });
          form.reset({ username: data.username, email: data.email });
        }
      }
    };
    fetchProfile();
  }, [params.wallet, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (address !== params.wallet) {
      alert('Unauthorized');
      return;
    }
    await setDoc(doc(db, 'kols', params.wallet), { ...data, wallet: params.wallet });
    setProfile({ ...data, wallet: params.wallet });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <p><strong>Wallet:</strong> {profile.wallet.slice(0, 6)}...{profile.wallet.slice(-4)}</p>
          </div>
          <Button type="submit" disabled={address !== params.wallet}>Update</Button>
        </form>
      </Form>
      <Button onClick={() => router.push('/dashboard')} className="mt-4">Back to Dashboard</Button>
    </div>
  );
}