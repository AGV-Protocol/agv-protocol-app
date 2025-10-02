"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { getBlogPostById, updateBlogPost, BlogPost } from "@/lib/blog";
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

export default function EditMediumBlogPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const postId = params?.id as string;
  
  const [who, setWho] = useState<WhoAmI>({
    authed: false,
    email: null,
    isAdmin: false,
    isSuperAdmin: false,
  });
  const [loading, setLoading] = useState(false);
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [fetchingPost, setFetchingPost] = useState(true);

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

  // Fetch blog post
  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!postId) return;
      
      setFetchingPost(true);
      try {
        const post = await getBlogPostById(postId);
        setBlogPost(post);
      } catch (error) {
        console.error('Error fetching blog post:', error);
        alert(t('admin.blog.fetchError'));
      } finally {
        setFetchingPost(false);
      }
    };

    fetchBlogPost();
  }, [postId, t]);

  const handleSave = async (formData: any) => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const success = await updateBlogPost(postId, formData);
      
      if (success) {
        router.push(`/${locale}/dashboard/blog`);
      } else {
        alert(t('admin.blog.updateError'));
      }
    } catch (error) {
      console.error('Error updating blog post:', error);
      alert(t('admin.blog.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (formData: any) => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const updateData = {
        ...formData,
        published: true,
        publishedAt: new Date()
      };
      
      const success = await updateBlogPost(postId, updateData);
      
      if (success) {
        router.push(`/${locale}/dashboard/blog`);
      } else {
        alert(t('admin.blog.updateError'));
      }
    } catch (error) {
      console.error('Error publishing blog post:', error);
      alert(t('admin.blog.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const doSignOut = async () => {
    await auth.signOut();
  };

  if (fetchingPost) {
    return (
      <DashboardLayout 
        user={{
          email: auth.currentUser?.email,
          name: auth.currentUser?.displayName,
          avatar: auth.currentUser?.photoURL
        }}
        onSignOut={doSignOut}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!blogPost) {
    return (
      <DashboardLayout 
        user={{
          email: auth.currentUser?.email,
          name: auth.currentUser?.displayName,
          avatar: auth.currentUser?.photoURL
        }}
        onSignOut={doSignOut}
      >
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('admin.blog.postNotFound')}
          </h2>
          <Link href={`/${locale}/dashboard/blog`}>
            <Button>{t('admin.blog.backToBlog')}</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

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
              <h1 className="text-3xl font-bold">{t('admin.blog.editTitle')}</h1>
              <p className="text-muted-foreground">
                {t('admin.blog.editSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Medium-like Blog Creator */}
        <MediumBlogCreator
          initialData={{
            title: blogPost.title,
            content: blogPost.content,
            excerpt: blogPost.excerpt,
            featuredImage: blogPost.featuredImage,
            category: blogPost.category,
            tags: blogPost.tags,
            author: blogPost.author,
            authorEmail: blogPost.authorEmail,
            published: blogPost.published,
            featured: blogPost.featured,
          }}
          onSave={handleSave}
          onPublish={handlePublish}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
}
