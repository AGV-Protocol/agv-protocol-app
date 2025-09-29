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

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = ["ALL", "ANNOUNCEMENTS", "TECH", "COMMUNITY"];

  // Sample data for featured article
  const featuredArticle = {
    image: "/herobg.png",
    title: "Introducing AGV Protocol: Unlocking the Future of Real-World Assets",
    description: "It's 2025, and the world's financial landscape is changing rapidly. As a result, one question keeps coming up...",
    category: "ANNOUNCEMENTS"
  };

  // Sample data for main articles with categories
  const allArticles = [
    {
      image: "/herobg.png",
      title: "The Future of Sustainable Web3",
      description: "Exploring how blockchain technology can drive environmental sustainability and create real-world impact.",
      category: "TECH"
    },
    {
      image: "/herobg.png",
      title: "NFT Staking Revolution",
      description: "Learn about our innovative staking mechanisms that reward users while supporting real-world assets.",
      category: "TECH"
    },
    {
      image: "/herobg.png",
      title: "Multi-Chain Integration",
      description: "Discover how AGV Protocol seamlessly operates across multiple blockchain networks for maximum accessibility.",
      category: "TECH"
    },
    {
      image: "/herobg.png",
      title: "Community Governance",
      description: "Understanding the role of community in shaping the future of decentralized finance and asset management.",
      category: "COMMUNITY"
    },
    {
      image: "/herobg.png",
      title: "Real-World Asset Tokenization",
      description: "How we're bridging the gap between traditional assets and blockchain technology for sustainable growth.",
      category: "TECH"
    },
    {
      image: "/herobg.png",
      title: "Security & Transparency",
      description: "Our commitment to maintaining the highest security standards while ensuring complete transparency.",
      category: "ANNOUNCEMENTS"
    },
    {
      image: "/herobg.png",
      title: "Developer Ecosystem",
      description: "Building tools and infrastructure to support developers in creating the next generation of Web3 applications.",
      category: "TECH"
    },
    {
      image: "/herobg.png",
      title: "Global Expansion",
      description: "AGV Protocol's journey to becoming a global leader in sustainable blockchain solutions.",
      category: "ANNOUNCEMENTS"
    },
    {
      image: "/herobg.png",
      title: "Community AMA Session",
      description: "Join our monthly Ask Me Anything session with the AGV Protocol team and get your questions answered.",
      category: "COMMUNITY"
    },
    {
      image: "/herobg.png",
      title: "Partnership Announcement",
      description: "We're excited to announce our new partnership with leading blockchain infrastructure providers.",
      category: "ANNOUNCEMENTS"
    },
    {
      image: "/herobg.png",
      title: "Technical Deep Dive: Smart Contracts",
      description: "A comprehensive look at our smart contract architecture and security measures.",
      category: "TECH"
    },
    {
      image: "/herobg.png",
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
    if (activeTab !== "ALL" && featuredArticle.category !== activeTab) {
      return false;
    }
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className="p-16 sm:p-20 bg-gray-50 flex">
        <div className="mx-auto px-4 sm:px-6 flex-1">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#223256] mb-6">
              INSIGHTS & UPDATES
            </h1>
            <p className="text-lg sm:text-xl text-[#223256] max-w-4xl mx-auto sm:mx-0">
              Stay up to date with AGV&apos;s latest news, articles, and thought leadership on sustainable Web3 innovation.
            </p>
          </div>
        </div>
        <div className="hidden sm:block mx-auto px-4 sm:px-6 flex-1">
          <div className="text-left">
            
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap gap-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-[#223256] text-white"
                    : "bg-gray-100 text-[#223256] hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Articles Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-left mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#223256] mb-4">
              FEATURED ARTICLES
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Featured Article Card - Only show if it matches current filters */}
            {shouldShowFeaturedArticle() && (
              <div className="order-1 lg:order-1">
                <FeaturedArticleCard
                  image={featuredArticle.image}
                  title={featuredArticle.title}
                  description={featuredArticle.description}
                  onReadMore={() => handleReadMore(featuredArticle.title)}
                />
              </div>
            )}

            {/* Search and Newsletter Form */}
            <div className="order-2 lg:order-2">
              <div className="bg-[#3399FF] rounded-2xl p-6 lg:p-8 space-y-6 lg:space-y-8">
                {/* Search Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">Search</h3>
                  <SearchForm onSearch={handleSearch} placeholder="Search articles..." />
                </div>

                {/* Newsletter Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Subscribe</h3>
                    <p className="text-white/90 text-sm">
                      Subscribe to our newsletter to get the latest insights directly in your inbox.
                    </p>
                  </div>
                  <NewsletterForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Articles Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-left mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#223256] mb-4">
              Main Articles
            </h2>
            {(activeTab !== "ALL" || searchQuery) && (
              <p className="text-[#223256] text-sm">
                {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
                {activeTab !== "ALL" && ` in ${activeTab}`}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            )}
          </div>

          {/* Articles Container */}
          <div className="bg-[#3399FF] rounded-2xl p-8 mb-8">
            {filteredArticles.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="text-center py-12">
                <p className="text-white text-xl font-medium">
                  {searchQuery ? `No articles found for "${searchQuery}"` : `No articles found in ${activeTab} category`}
                </p>
              </div>
            )}
            <div className="text-center mt-10">
              <Button
                size="lg"
                className="bg-white border border-[#223256] text-[#223256] hover:bg-[#223256] hover:text-white transition-all duration-300 px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 mx-auto"
              >
                <span>View All Posts</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
