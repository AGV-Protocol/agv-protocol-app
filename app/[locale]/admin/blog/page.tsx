"use client";
import React, { useEffect, useState } from "react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useTranslations } from "@/hooks/useTranslations";
import { getBlogPosts, deleteBlogPost, BlogPost } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Tag,
  Search,
  Filter,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BlogManagementPage() {
  const { t } = useTranslations();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[70pc] left-0 w-[1000px] h-[1000px] bg-[#4FACFE]/10 rounded-full -translate-x-[600px] -translate-y-[600px]"></div>
        <div className="absolute top-[100pc] right-0 w-[1000px] h-[1000px] bg-[#4FACFE]/10 rounded-full translate-x-[500px] -translate-y-[500px]"></div>
      </div>
      
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#223256] mb-2">
              {t('admin.blog.title')}
            </h1>
            <p className="text-[#223256]/70">
              {t('admin.blog.subtitle')}
            </p>
          </div>
          <Link href="/admin/blog/create">
            <Button className="bg-[#4FACFE] text-white hover:bg-[#3B8BCC] flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>{t('admin.blog.createNew')}</span>
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-100">
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
        </div>

        {/* Blog Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4FACFE]"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
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
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            post.category === 'ANNOUNCEMENTS' ? 'bg-blue-100 text-blue-800' :
                            post.category === 'TECH' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {t(`blog.tabs.${post.category.toLowerCase()}`)}
                          </span>
                          {post.featured && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                              {t('admin.blog.featured')}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            post.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {post.published ? t('admin.blog.published') : t('admin.blog.draft')}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-[#223256] mb-2 line-clamp-2">
                          {post.title}
                        </h3>

                        <p className="text-[#223256]/70 text-sm mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#223256]/60">
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
                          <Link href={`/blog/${post.slug}`}>
                            <Button variant="ghost" size="sm" className="text-[#4FACFE] hover:text-[#3B8BCC]">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        <Link href={`/admin/blog/edit/${post.id}`}>
                          <Button variant="ghost" size="sm" className="text-[#223256] hover:text-[#4FACFE]">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id!)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-[#223256]/60 mb-4">
              <Filter className="w-12 h-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold text-[#223256] mb-2">
              {t('admin.blog.noPosts')}
            </h3>
            <p className="text-[#223256]/70 mb-6">
              {t('admin.blog.noPostsDescription')}
            </p>
            <Link href="/admin/blog/create">
              <Button className="bg-[#4FACFE] text-white hover:bg-[#3B8BCC]">
                {t('admin.blog.createFirst')}
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
