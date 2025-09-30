"use client";
import React, { useState } from "react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ArticleCard } from "@/components/landing/ArticleCard";
import { FeaturedArticleCard } from "@/components/landing/FeaturedArticleCard";
import { SearchForm } from "@/components/landing/SearchForm";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";

export default function BlogPage() {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = ["ALL", "ANNOUNCEMENTS", "TECH", "COMMUNITY"];

  // Sample data for featured article
  const featuredArticle = {
    image: "/blog/featured-article.png",
    title: "Introducing AGV Protocol: Unlocking the Future of Real-World Assets",
    description: "It's 2025, and the world's financial landscape is changing rapidly. As a result, one question keeps coming up...",
  };

  // Sample data for main articles with categories
  const allArticles = [
    {
      image: "/blog/article.png",
      title: "The Future of Sustainable Web3",
      description: "Exploring how blockchain technology can drive environmental sustainability and create real-world impact.",
      category: "TECH"
    },
    {
      image: "/blog/article.png",
      title: "NFT Staking Revolution",
      description: "Learn about our innovative staking mechanisms that reward users while supporting real-world assets.",
      category: "TECH"
    },
    {
      image: "/blog/article.png",
      title: "Multi-Chain Integration",
      description: "Discover how AGV Protocol seamlessly operates across multiple blockchain networks for maximum accessibility.",
      category: "TECH"
    },
    {
      image: "/blog/article.png",
      title: "Community Governance",
      description: "Understanding the role of community in shaping the future of decentralized finance and asset management.",
      category: "COMMUNITY"
    },
    {
      image: "/blog/article.png",
      title: "Real-World Asset Tokenization",
      description: "How we're bridging the gap between traditional assets and blockchain technology for sustainable growth.",
      category: "TECH"
    },
    {
      image: "/blog/article.png",
      title: "Security & Transparency",
      description: "Our commitment to maintaining the highest security standards while ensuring complete transparency.",
      category: "ANNOUNCEMENTS"
    },
    {
      image: "/blog/article.png",
      title: "Developer Ecosystem",
      description: "Building tools and infrastructure to support developers in creating the next generation of Web3 applications.",
      category: "TECH"
    },
    {
      image: "/blog/article.png",
      title: "Global Expansion",
      description: "AGV Protocol's journey to becoming a global leader in sustainable blockchain solutions.",
      category: "ANNOUNCEMENTS"
    },
    {
      image: "/blog/article.png",
      title: "Community AMA Session",
      description: "Join our monthly Ask Me Anything session with the AGV Protocol team and get your questions answered.",
      category: "COMMUNITY"
    },
    {
      image: "/blog/article.png",
      title: "Partnership Announcement",
      description: "We're excited to announce our new partnership with leading blockchain infrastructure providers.",
      category: "ANNOUNCEMENTS"
    },
    {
      image: "/blog/article.png",
      title: "Technical Deep Dive: Smart Contracts",
      description: "A comprehensive look at our smart contract architecture and security measures.",
      category: "TECH"
    },
    {
      image: "/blog/article.png",
      title: "Community Spotlight: Success Stories",
      description: "Hear from our community members about their experiences with AGV Protocol.",
      category: "COMMUNITY"
    }
  ];

  // Filter articles based on active tab and search query
  const filteredArticles = allArticles.filter(article => {
    const matchesTab = activeTab === "ALL" || article.category === activeTab;
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Check if featured article should be shown based on current filters
  const shouldShowFeaturedArticle = () => {
    if (searchQuery !== "" && 
        !featuredArticle.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !featuredArticle.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleReadMore = (title: string) => {
    // In a real application, this would navigate to the full article
    console.log(`Read more about ${title}`);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Left semicircle */}
        <div className="absolute top-[70pc] left-0 w-[1000px] h-[1000px] bg-[#4FACFE]/10 rounded-full -translate-x-[600px] -translate-y-[600px]"></div>
        {/* Right semicircle */}
        <div className="absolute top-[100pc] right-0 w-[1000px] h-[1000px] bg-[#4FACFE]/10 rounded-full translate-x-[500px] -translate-y-[500px]"></div>
      </div>
      
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-transparent flex items-center justify-center relative z-10">
        <div className="mx-auto max-w-4xl flex-1">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#223256] mb-4 sm:mb-6 uppercase">
              {t('blog.hero.title')}
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#223256] px-2 sm:px-4 md:px-8 lg:px-16 xl:px-36 text-center leading-relaxed">
              {t('blog.hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      
      {/* Featured Articles Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#223256] mb-4">
              {t('blog.featured.title')}
            </h2>
          </div>

          <div>
            {/* Featured Article Card - Only show if it matches current filters */}
            <div className="order-1 lg:order-1">
              <FeaturedArticleCard
                image={featuredArticle.image}
                title={featuredArticle.title}
                description={featuredArticle.description}
                onReadMore={() => handleReadMore(featuredArticle.title)}
              />
            </div>
          </div>
        </div>
      </section>


      {/* Tab Navigation */}
      <section className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-transparent border-b border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex flex-wrap gap-2 sm:gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 text-xs sm:text-sm ${
                    activeTab === tab
                      ? "bg-[#223256] text-white"
                      : "bg-white/80 backdrop-blur-sm text-[#223256] hover:bg-white/90 border border-gray-200"
                  }`}
                >
                  {t(`blog.tabs.${tab.toLowerCase()}`)}
                </button>
              ))}
            </div>
            <div className="w-full sm:w-auto">
              <SearchForm onSearch={handleSearch} placeholder={t('blog.searchPlaceholder')} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Articles Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left mb-8 sm:mb-12">
            {(activeTab !== "ALL" || searchQuery) && (
              <p className="text-[#223256] text-xs sm:text-sm">
                {filteredArticles.length} {t('blog.main.articlesFound', { count: filteredArticles.length })}
                {activeTab !== "ALL" && ` ${t('blog.main.inCategory', { category: t(`blog.tabs.${activeTab.toLowerCase()}`) })}`}
                {searchQuery && ` ${t('blog.main.forQuery', { query: searchQuery })}`}
              </p>
            )}
          </div>

          {/* Articles Container */}
          <div className="rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredArticles.map((article, index) => (
                  <ArticleCard
                    key={index}
                    image={article.image}
                    title={article.title}
                    description={article.description}
                    onReadMore={() => handleReadMore(article.title)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-[#223256] text-lg sm:text-xl font-medium">
                  {searchQuery ? t('blog.main.noResultsForQuery', { query: searchQuery }) : t('blog.main.noResultsInCategory', { category: t(`blog.tabs.${activeTab.toLowerCase()}`) })}
                </p>
              </div>
            )}
            <div className="text-center mt-8 sm:mt-10">
              <Button
                size="lg"
                className="bg-white/80 backdrop-blur-sm border border-[#223256] text-[#223256] hover:bg-[#223256] hover:text-white transition-all duration-300 px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold flex items-center space-x-2 mx-auto text-sm sm:text-base"
              >
                <span>{t('blog.main.viewAllPosts')}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
          
        </div>
      </section>
      {/* Newsletter Form */}
      <section className="pb-12 sm:py-16 lg:py-20 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row">
            <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 flex-1">

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#223256] mb-2">{t('blog.newsletter.title')}</h3>
                  <p className="text-[#223256] text-xs sm:text-sm leading-relaxed">
                    {t('blog.newsletter.description')}
                  </p>
                </div>
                <NewsletterForm />
              </div>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 flex-1 hidden lg:block">
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}