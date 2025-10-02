"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { getBlogPosts, deleteBlogPost, BlogPost } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Tag,
  Search,
  Filter,
  FileText
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "@/hooks/useTranslations";
import { useParams } from "next/navigation";

type WhoAmI = {
  authed: boolean;
  email: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

export default function DashboardBlogPage() {
  const { t } = useTranslations();
  const params = useParams();
  const locale = params?.locale as string;
  const [who, setWho] = useState<WhoAmI>({
    authed: false,
    email: null,
    isAdmin: false,
    isSuperAdmin: false,
  });
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  useEffect(() => {
    fetchBlogPosts();
  }, [categoryFilter, statusFilter]);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      const filters = {
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        published: statusFilter === "PUBLISHED" ? true : statusFilter === "DRAFT" ? false : undefined
      };
      const posts = await getBlogPosts(filters);
      setBlogPosts(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('admin.blog.confirmDelete'))) {
      try {
        const success = await deleteBlogPost(id);
        if (success) {
          setBlogPosts(blogPosts.filter(post => post.id !== id));
        }
      } catch (error) {
        console.error("Error deleting blog post:", error);
      }
    }
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('admin.blog.title')}</h1>
            <p className="text-muted-foreground">
              {t('admin.blog.subtitle')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/${locale}/dashboard/blog/create-medium`}>
              <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Write Story</span>
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/blog/create`}>
              <Button variant="outline" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>{t('admin.blog.createNew')}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('admin.blog.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4FACFE] focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4FACFE] focus:border-transparent"
              >
                <option value="ALL">{t('admin.blog.allCategories')}</option>
                <option value="ANNOUNCEMENTS">{t('blog.tabs.announcements')}</option>
                <option value="TECH">{t('blog.tabs.tech')}</option>
                <option value="COMMUNITY">{t('blog.tabs.community')}</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4FACFE] focus:border-transparent"
              >
                <option value="ALL">{t('admin.blog.allStatus')}</option>
                <option value="PUBLISHED">{t('admin.blog.published')}</option>
                <option value="DRAFT">{t('admin.blog.draft')}</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Blog Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4FACFE]"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid gap-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Featured Image */}
                    {post.featuredImage && (
                      <div className="lg:w-48 flex-shrink-0">
                        <Image
                          src={post.featuredImage}
                          alt={post.title}
                          width={200}
                          height={120}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={post.category === 'ANNOUNCEMENTS' ? 'default' : post.category === 'TECH' ? 'secondary' : 'outline'}>
                              {t(`blog.tabs.${post.category.toLowerCase()}`)}
                            </Badge>
                            {post.featured && (
                              <Badge variant="destructive">
                                {t('admin.blog.featured')}
                              </Badge>
                            )}
                            <Badge variant={post.published ? 'default' : 'secondary'}>
                              {post.published ? t('admin.blog.published') : t('admin.blog.draft')}
                            </Badge>
                          </div>

                          <h3 className="text-lg font-bold mb-2 line-clamp-2">
                            {post.title}
                          </h3>

                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(post.createdAt)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{post.views} {t('admin.blog.views')}</span>
                            </div>
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <Tag className="w-3 h-3" />
                                <span>{post.tags.length} {t('admin.blog.tags')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          {post.published && (
                            <Link href={`/${locale}/blog/${post.slug}`}>
                              <Button variant="ghost" size="sm" className="text-[#4FACFE] hover:text-[#3B8BCC]" title="View">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                          <Link href={`/${locale}/dashboard/blog/edit-medium/${post.id}`}>
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" title="Edit Story (Medium-style)">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/${locale}/dashboard/blog/edit/${post.id}`}>
                            <Button variant="ghost" size="sm" className="text-[#223256] hover:text-[#4FACFE]" title="Edit (Classic)">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(post.id!)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('admin.blog.noPosts')}
              </h3>
              <p className="text-muted-foreground mb-6 text-center">
                {t('admin.blog.noPostsDescription')}
              </p>
              <Link href={`/${locale}/dashboard/blog/create`}>
                <Button className="bg-[#4FACFE] text-white hover:bg-[#3B8BCC]">
                  {t('admin.blog.createFirst')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

