"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { getBlogPost, updateBlogPost, generateSlug, BlogPost } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff, 
  Upload,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "@/hooks/useTranslations";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

type WhoAmI = {
  authed: boolean;
  email: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

export default function EditBlogPage() {
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const blogId = params?.id as string;

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
          router.push(`/${locale}/dashboard/blog`);
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        router.push(`/${locale}/dashboard/blog`);
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

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    try {
      const storageRef = ref(storage, `blog-images/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadedImages(prev => [...prev, downloadURL]);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const insertImageAtCursor = (imageUrl: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const imageTag = `<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto;" />`;
    
    const newContent = formData.content.substring(0, start) + imageTag + formData.content.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  const formatText = (format: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        formattedText = `<em>${selectedText}</em>`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'quote':
        formattedText = `<blockquote>${selectedText}</blockquote>`;
        break;
      case 'list':
        formattedText = `<ul><li>${selectedText}</li></ul>`;
        break;
      case 'ordered-list':
        formattedText = `<ol><li>${selectedText}</li></ol>`;
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          formattedText = `<a href="${url}">${selectedText}</a>`;
        } else {
          return;
        }
        break;
    }

    const newContent = formData.content.substring(0, start) + formattedText + formData.content.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
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

  const doSignOut = async () => {
    await auth.signOut();
  };

  if (initialLoading) {
    return (
      <DashboardLayout 
        user={{
          email: auth.currentUser?.email,
          name: auth.currentUser?.displayName,
          avatar: auth.currentUser?.photoURL
        }}
        onSignOut={doSignOut}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4FACFE]"></div>
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
          <Card>
            <CardHeader>
              <CardTitle>Edit Blog Post</CardTitle>
              <CardDescription>Update your blog post content</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">{t('admin.blog.form.title')} *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder={t('admin.blog.form.titlePlaceholder')}
                  />
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt">{t('admin.blog.form.excerpt')} *</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder={t('admin.blog.form.excerptPlaceholder')}
                  />
                </div>

                {/* Content with Rich Text Tools */}
                <div className="space-y-2">
                  <Label htmlFor="content">{t('admin.blog.form.content')} *</Label>
                  
                  {/* Rich Text Toolbar */}
                  <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText('bold')}
                      className="h-8 w-8 p-0"
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText('italic')}
                      className="h-8 w-8 p-0"
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText('underline')}
                      className="h-8 w-8 p-0"
                    >
                      <Underline className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText('list')}
                      className="h-8 w-8 p-0"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText('ordered-list')}
                      className="h-8 w-8 p-0"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText('quote')}
                      className="h-8 w-8 p-0"
                    >
                      <Quote className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => formatText('link')}
                      className="h-8 w-8 p-0"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows={10}
                    placeholder={t('admin.blog.form.contentPlaceholder')}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('admin.blog.form.contentHelp')}
                  </p>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Upload Images</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {uploading ? 'Uploading...' : 'Click to upload image'}
                      </span>
                    </label>
                  </div>

                  {/* Uploaded Images */}
                  {uploadedImages.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Images</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {uploadedImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Uploaded ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => insertImageAtCursor(imageUrl)}
                                className="bg-white text-black hover:bg-gray-100"
                              >
                                <ImageIcon className="w-3 h-3 mr-1" />
                                Insert
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Featured Image */}
                <div className="space-y-2">
                  <Label htmlFor="featuredImage">{t('admin.blog.form.featuredImage')}</Label>
                  <Input
                    id="featuredImage"
                    name="featuredImage"
                    value={formData.featuredImage}
                    onChange={handleInputChange}
                    placeholder={t('admin.blog.form.imagePlaceholder')}
                  />
                </div>

                {/* Category and Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">{t('admin.blog.form.category')} *</Label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#4FACFE] focus:border-transparent"
                    >
                      <option value="COMMUNITY">{t('blog.tabs.community')}</option>
                      <option value="ANNOUNCEMENTS">{t('blog.tabs.announcements')}</option>
                      <option value="TECH">{t('blog.tabs.tech')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">{t('admin.blog.form.tags')}</Label>
                    <Input
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder={t('admin.blog.form.tagsPlaceholder')}
                    />
                  </div>
                </div>

                {/* Author Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">{t('admin.blog.form.author')} *</Label>
                    <Input
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      required
                      placeholder={t('admin.blog.form.authorPlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authorEmail">{t('admin.blog.form.authorEmail')} *</Label>
                    <Input
                      id="authorEmail"
                      name="authorEmail"
                      type="email"
                      value={formData.authorEmail}
                      onChange={handleInputChange}
                      required
                      placeholder={t('admin.blog.form.emailPlaceholder')}
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="published"
                      name="published"
                      checked={formData.published}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#4FACFE] bg-gray-100 border-gray-300 rounded focus:ring-[#4FACFE]"
                    />
                    <Label htmlFor="published">{t('admin.blog.form.publish')}</Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="featured"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#4FACFE] bg-gray-100 border-gray-300 rounded focus:ring-[#4FACFE]"
                    />
                    <Label htmlFor="featured">{t('admin.blog.form.featured')}</Label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#4FACFE] text-white hover:bg-[#3B8BCC] flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? t('admin.blog.updating') : t('admin.blog.update')}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.blog.preview')}</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.title && (
                  <div className="space-y-4">
                    {formData.featuredImage && (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={formData.featuredImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div>
                      <h2 className="text-xl font-bold mb-2">
                        {formData.title}
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        {formData.excerpt}
                      </p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Author: {formData.author}</p>
                        <p>Category: {t(`blog.tabs.${formData.category.toLowerCase()}`)}</p>
                        {formData.tags && (
                          <p>Tags: {formData.tags}</p>
                        )}
                        <div className="flex gap-2">
                          {formData.published && <Badge>Published</Badge>}
                          {formData.featured && <Badge variant="destructive">Featured</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
