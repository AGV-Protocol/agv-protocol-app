import React from "react";
import { 
  Database, 
  Zap, 
  Shield, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Github,
  Twitter,
  MessageCircle,
  Send,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const MainContent: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-[#66CCFF] to-white py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Platform Overview */}
        <div className="mb-16 sm:mb-20">
          <div className="flex items-center mb-8 sm:mb-12">
            <div className="w-2 h-2 bg-[#3399FF] rounded-full mr-3"></div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3399FF]">PLATFORM OVERVIEW</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Supply */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">1,234</div>
                  <div className="text-sm sm:text-base text-gray-600">NFTs Minted</div>
                  <div className="text-xs sm:text-sm text-gray-500">Total Supply</div>
                </div>
              </div>
            </div>

            {/* Reward Rate */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">50.00</div>
                  <div className="text-sm sm:text-base text-gray-600">rGGP/Daily</div>
                  <div className="text-xs sm:text-sm text-gray-500">Reward Rate</div>
                </div>
              </div>
            </div>

            {/* Audit Rating */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">98%</div>
                  <div className="text-sm sm:text-base text-gray-600">Security Score</div>
                  <div className="text-xs sm:text-sm text-gray-500">Audit Rating</div>
                </div>
              </div>
            </div>

            {/* Placeholder Card */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border-2 border-dashed border-gray-200">
              <div className="flex items-center justify-center h-full min-h-[80px]">
                <div className="text-gray-400 text-sm">Coming Soon</div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Features */}
        <div className="mb-16 sm:mb-20">
          <div className="flex items-center mb-8 sm:mb-12">
            <div className="w-2 h-2 bg-[#3399FF] rounded-full mr-3"></div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3399FF]">CORE FEATURES</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Multi-Chain Support */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Multi-Chain Support</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Deploy and manage NFTs across BSC, Polygon and Arbitrum networks.
                  </p>
                </div>
              </div>
            </div>

            {/* Secure Meeting */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Secure Meeting</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Advanced security measures and smart contract audits.
                  </p>
                </div>
              </div>
            </div>

            {/* Instant Rewards */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-7 h-7 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Instant Rewards</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Earn rewards immediately after minting with our staking system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Get Started */}
        <div className="mb-16 sm:mb-20">
          <div className="flex items-center mb-8 sm:mb-12">
            <div className="w-2 h-2 bg-[#3399FF] rounded-full mr-3"></div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3399FF]">GET STARTED</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Mint NFTs */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Mint NFTs</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Mint AGV Protocol NFTs across multiple chains
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-black text-black hover:bg-gray-50"
              >
                Start Mining <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Stake & Earn */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Stake & Earn</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Stake your NFTs to earn daily reward.
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-black text-black hover:bg-gray-50"
              >
                Stake Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Lightpaper */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Lightpaper</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Explore token information and documentation.
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-black text-black hover:bg-gray-50"
              >
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Community */}
        <div className="mb-16 sm:mb-20">
          <div className="flex items-center mb-8 sm:mb-12">
            <div className="w-2 h-2 bg-[#3399FF] rounded-full mr-3"></div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3399FF]">COMMUNITY</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Github */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Github className="w-7 h-7 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Github</h3>
                  <p className="text-sm text-gray-600">2.1k Stars</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-black text-black hover:bg-gray-50"
              >
                Follow <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Twitter */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Twitter className="w-7 h-7 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Twitter</h3>
                  <p className="text-sm text-gray-600">500k Followers</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-black text-black hover:bg-gray-50"
              >
                Follow <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Discord */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-7 h-7 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Discord</h3>
                  <p className="text-sm text-gray-600">60k Members</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-black text-black hover:bg-gray-50"
              >
                Follow <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Telegram */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Send className="w-7 h-7 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Telegram</h3>
                  <p className="text-sm text-gray-600">5.8k Members</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-black text-black hover:bg-gray-50"
              >
                Follow <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Latest Update */}
        <div className="mb-8">
          <div className="flex items-center mb-8 sm:mb-12">
            <div className="w-2 h-2 bg-[#3399FF] rounded-full mr-3"></div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3399FF]">LATEST UPDATE</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Article 1 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    Getting started with AGV Protocol
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">
                    Learn how to mint your first NFT and start earning rewards.
                  </p>
                  <p className="text-xs text-gray-500">2024-04-05</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-black text-black hover:bg-gray-50"
              >
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Article 2 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    Understanding Multi-chain Staking
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">
                    A comprehensive guide to staking across different chains
                  </p>
                  <p className="text-xs text-gray-500">2024-04-05</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-black text-black hover:bg-gray-50"
              >
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Article 3 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    Strong Security Best Practices
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">
                    How to keep your NFTs and rewards safe
                  </p>
                  <p className="text-xs text-gray-500">2024-04-05</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-black text-black hover:bg-gray-50"
              >
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
