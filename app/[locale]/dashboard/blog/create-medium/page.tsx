"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createBlogPost, generateSlug, BlogPost } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { MediumBlogCreator } from "@/components/blog/medium-blog-creator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "@/hooks/useTranslations";

type WhoAmI = {
  authed: boolean;
  email: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

export default function CreateMediumBlogPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const [who, setWho] = useState<WhoAmI>({
    authed: false,
    email: null,
    isAdmin: false,
    isSuperAdmin: false,
  });
  const [loading, setLoading] = useState(false);

  // Fetch server-verified role
  useEffect(() => {
    (async () => {
      if (!auth.currentUser) {
        setWho({ authed: false, email: null, isAdmin: false, isSuperAdmin: false });
        return;
      }
      try {
        const idToken = await auth.currentUser.getIdToken(true);
        const res = await fetch("/api/admin/whoami", {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (data) setWho(data);
      } catch {
        setWho((s) => ({ ...s, isAdmin: false, isSuperAdmin: false }));
      }
    })();
  }, []);

  const handleSave = async (formData: any) => {
    setLoading(true);
    try {
      const slug = generateSlug(formData.title);
      const blogPostData = {
        ...formData,
        slug,
        publishedAt: formData.published ? new Date() : undefined
      };

      const postId = await createBlogPost(blogPostData);
      
      if (postId) {
        router.push(`/${locale}/dashboard/blog`);
      } else {
        alert(t('admin.blog.createError'));
      }
    } catch (error) {
      console.error('Error creating blog post:', error);
      alert(t('admin.blog.createError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (formData: any) => {
    setLoading(true);
    try {
      const slug = generateSlug(formData.title);
      const blogPostData = {
        ...formData,
        published: true,
        slug,
        publishedAt: new Date()
      };

      const postId = await createBlogPost(blogPostData);
      
      if (postId) {
        router.push(`/${locale}/dashboard/blog`);
      } else {
        alert(t('admin.blog.createError'));
      }
    } catch (error) {
      console.error('Error publishing blog post:', error);
      alert(t('admin.blog.createError'));
    } finally {
      setLoading(false);
    }
  };

  const doSignOut = async () => {
    await auth.signOut();
  };

  return (
    <DashboardLayout 
      user={{
        email: auth.currentUser?.email,
        name: auth.currentUser?.displayName,
        avatar: auth.currentUser?.photoURL
      }}
      onSignOut={doSignOut}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/${locale}/dashboard/blog`}>
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>{t('admin.blog.backToBlog')}</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{t('admin.blog.createTitle')}</h1>
              <p className="text-muted-foreground">
                {t('admin.blog.createSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Medium-like Blog Creator */}
        <MediumBlogCreator
          onSave={handleSave}
          onPublish={handlePublish}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
}

