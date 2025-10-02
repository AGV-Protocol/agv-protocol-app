"use client";
import React, { useEffect, useState } from "react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useTranslations } from "@/hooks/useTranslations";
import { getBlogPost, updateBlogPost, generateSlug, BlogPost } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function EditBlogPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    category: "COMMUNITY" as BlogPost['category'],
    tags: "",
    author: "",
    authorEmail: "",
    published: false,
    featured: false
  });

  const blogId = params?.id as string;

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!blogId) return;
      
      try {
        setInitialLoading(true);
        const post = await getBlogPost(blogId);
        
        if (post) {
          setFormData({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            featuredImage: post.featuredImage,
            category: post.category,
            tags: post.tags.join(', '),
            author: post.author,
            authorEmail: post.authorEmail,
            published: post.published,
            featured: post.featured
          });
        } else {
          router.push('/admin/blog');
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        router.push('/admin/blog');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchBlogPost();
  }, [blogId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const slug = generateSlug(formData.title);

      const blogPostData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        featuredImage: formData.featuredImage,
        category: formData.category,
        tags: tagsArray,
        author: formData.author,
        authorEmail: formData.authorEmail,
        published: formData.published,
        featured: formData.featured,
        slug,
        publishedAt: formData.published ? new Date() : undefined
      };

      const success = await updateBlogPost(blogId, blogPostData);
      
      if (success) {
        router.push('/admin/blog');
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4FACFE]"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[70pc] left-0 w-[1000px] h-[1000px] bg-[#4FACFE]/10 rounded-full -translate-x-[600px] -translate-y-[600px]"></div>
        <div className="absolute top-[100pc] right-0 w-[1000px] h-[1000px] bg-[#4FACFE]/10 rounded-full translate-x-[500px] -translate-y-[500px]"></div>
      </div>
      
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/admin/blog">
              <Button variant="ghost" className="flex items-center space-x-2 text-[#223256] hover:text-[#4FACFE]">
                <ArrowLeft className="w-4 h-4" />
                <span>{t('admin.blog.backToBlog')}</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#223256]">
                {t('admin.blog.editTitle')}
              </h1>
              <p className="text-[#223256]/70">
                {t('admin.blog.editSubtitle')}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPreview ? t('admin.blog.hidePreview') : t('admin.blog.showPreview')}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-[#223256] mb-2">
                  {t('admin.blog.form.title')} *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4FACFE] focus:border-transparent"
                  placeholder={t('admin.blog.form.titlePlaceholder')}
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-semibold text-[#223256] mb-2">
                  {t('admin.blog.form.excerpt')} *
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4FACFE] focus:border-transparent"
                  placeholder={t('admin.blog.form.excerptPlaceholder')}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-[#223256] mb-2">
                  {t('admin.blog.form.content')} *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4FACFE] focus:border-transparent"
                  placeholder={t('admin.blog.form.contentPlaceholder')}
                />
                <p className="text-xs text-[#223256]/60 mt-1">
                  {t('admin.blog.form.contentHelp')}
                </p>
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-semibold text-[#223256] mb-2">
                  {t('admin.blog.form.featuredImage')}
                </label>
                <input
                  type="url"
                  name="featuredImage"
                  value={formData.featuredImage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4FACFE] focus:border-transparent"
                  placeholder={t('admin.blog.form.imagePlaceholder')}
                />
              </div>

              {/* Category and Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#223256] mb-2">
                    {t('admin.blog.form.category')} *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4FACFE] focus:border-transparent"
                  >
                    <option value="COMMUNITY">{t('blog.tabs.community')}</option>
                    <option value="ANNOUNCEMENTS">{t('blog.tabs.announcements')}</option>
                    <option value="TECH">{t('blog.tabs.tech')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#223256] mb-2">
                    {t('admin.blog.form.tags')}
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4FACFE] focus:border-transparent"
                    placeholder={t('admin.blog.form.tagsPlaceholder')}
                  />
                </div>
              </div>

              {/* Author Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#223256] mb-2">
                    {t('admin.blog.form.author')} *
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4FACFE] focus:border-transparent"
                    placeholder={t('admin.blog.form.authorPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#223256] mb-2">
                    {t('admin.blog.form.authorEmail')} *
                  </label>
                  <input
                    type="email"
                    name="authorEmail"
                    value={formData.authorEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4FACFE] focus:border-transparent"
                    placeholder={t('admin.blog.form.emailPlaceholder')}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="published"
                    checked={formData.published}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#4FACFE] bg-gray-100 border-gray-300 rounded focus:ring-[#4FACFE]"
                  />
                  <label className="text-sm font-semibold text-[#223256]">
                    {t('admin.blog.form.publish')}
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#4FACFE] bg-gray-100 border-gray-300 rounded focus:ring-[#4FACFE]"
                  />
                  <label className="text-sm font-semibold text-[#223256]">
                    {t('admin.blog.form.featured')}
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#4FACFE] text-white hover:bg-[#3B8BCC] flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? t('admin.blog.updating') : t('admin.blog.update')}</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-[#223256] mb-4">
                {t('admin.blog.preview')}
              </h3>
              
              {formData.title && (
                <div className="space-y-4">
                  {formData.featuredImage && (
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <img
                        src={formData.featuredImage}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div>
                    <h2 className="text-xl font-bold text-[#223256] mb-2">
                      {formData.title}
                    </h2>
                    <p className="text-[#223256]/70 mb-4">
                      {formData.excerpt}
                    </p>
                    <div className="text-sm text-[#223256]/60">
                      <p>Author: {formData.author}</p>
                      <p>Category: {t(`blog.tabs.${formData.category.toLowerCase()}`)}</p>
                      {formData.tags && (
                        <p>Tags: {formData.tags}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
