'use client';

import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { Loader, Trash2, PlusCircle, Settings as SettingsIcon, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/app/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, doc } from 'firebase/firestore';
import { CustomCategory } from '@/types';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [privacyShield, setPrivacyShield] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('privacyShield') === 'true';
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);
  
  useEffect(() => {
    localStorage.setItem('privacyShield', String(privacyShield));
  }, [privacyShield]);

  const customCategoriesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'custom_categories');
  }, [user, firestore]);

  const { data: customCategories, isLoading: areCategoriesLoading } = useCollection<CustomCategory>(customCategoriesQuery);

  const handleAddCategory = () => {
    if (!newCategoryName.trim() || !user || !firestore) return;

    if (newCategoryName.length > 50) {
        toast({ variant: 'destructive', title: 'Category name too long', description: 'Please keep it under 50 characters.' });
        return;
    }

    const categoriesCollection = collection(firestore, 'users', user.uid, 'custom_categories');
    addDocumentNonBlocking(categoriesCollection, {
      name: newCategoryName.trim(),
      userId: user.uid,
    });
    setNewCategoryName('');
    toast({ title: 'Category Added', description: `"${newCategoryName.trim()}" has been added.` });
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!user || !firestore) return;
    const categoryDoc = doc(firestore, 'users', user.uid, 'custom_categories', categoryId);
    deleteDocumentNonBlocking(categoryDoc);
    toast({ title: 'Category Deleted', description: 'The category has been removed.' });
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const glassmorphismStyle = 'bg-card/30 backdrop-blur-lg border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader activePage="settings" />
      <main className="container mx-auto max-w-2xl flex-grow px-4 pt-24 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your application preferences.</p>
            </div>
        </div>
        
        <div className="space-y-8">
          <Card className={glassmorphismStyle}>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Manage general application settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="privacy-shield" className="text-base flex items-center gap-2">
                    <Shield />
                    Privacy Shield
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, camera and screen are not recorded.
                  </p>
                </div>
                <Switch
                  id="privacy-shield"
                  checked={privacyShield}
                  onCheckedChange={setPrivacyShield}
                  aria-label="Privacy Shield"
                />
              </div>
            </CardContent>
          </Card>

          <Card className={glassmorphismStyle}>
            <CardHeader>
              <CardTitle>Custom Categories</CardTitle>
              <CardDescription>
                Add or remove custom categories for the AI to use when analyzing your activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="e.g., Language Learning"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button onClick={handleAddCategory}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Your Categories</h4>
              <ScrollArea className="h-48 rounded-md border bg-background/50 p-2">
                {areCategoriesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="h-5 w-5 animate-spin" />
                  </div>
                ) : customCategories && customCategories.length > 0 ? (
                  <div className="space-y-2">
                    {customCategories.map(category => (
                      <div key={category.id} className="flex items-center justify-between rounded-md bg-secondary/50 p-2 px-3">
                        <span className="text-sm">{category.name}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    <p>You haven't added any custom categories yet.</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
