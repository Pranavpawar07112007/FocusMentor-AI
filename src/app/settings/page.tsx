'use client';

import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { Loader, Trash2, PlusCircle, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, doc } from 'firebase/firestore';
import { CustomCategory } from '@/types';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SettingsPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

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

  const glassmorphismStyle = 'bg-card/30 backdrop-blur-lg border border-border/50 shadow-lg';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="fixed top-4 left-4 right-4 z-40 flex h-16 items-center justify-between rounded-lg border border-border/20 bg-background/80 px-6 backdrop-blur-lg">
        <h1 className="text-xl font-bold text-primary font-headline">
          <Link href="/">FocusMentor AI</Link>
        </h1>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/">Back to Focus</Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <main className="container mx-auto max-w-2xl flex-grow px-4 pt-24 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your application preferences.</p>
            </div>
        </div>

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
      </main>
    </div>
  );
}
