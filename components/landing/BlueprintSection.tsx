import React from "react";

export const BlueprintSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-slate-900 via-blue-900 to-teal-600 py-16 sm:py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Glowing dots */}
        <div className="absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Circuit board background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full">
            {Array.from({ length: 25 }).map((_, i) => (
              <g key={i}>
                <line
                  x1={`${Math.random() * 100}%`}
                  y1={`${Math.random() * 100}%`}
                  x2={`${Math.random() * 100}%`}
                  y2={`${Math.random() * 100}%`}
                  stroke="#60a5fa"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
                <circle
                  cx={`${Math.random() * 100}%`}
                  cy={`${Math.random() * 100}%`}
                  r="0.5"
                  fill="#34d399"
                  opacity="0.4"
                />
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Text Content */}
        <div className="mb-12 sm:mb-16">
          {/* Centered Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-blue-200 mb-8 sm:mb-12 leading-tight">
            Why AGV Is a Blueprint for Real Yield Infrastructure?
          </h2>
          
          {/* Left-aligned paragraphs */}
          <div className="max-w-4xl mx-auto">
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed mb-6">
              AGV is not a one-off project. It's a replicable protocol turning real land into digital yield infrastructure.
            </p>
            
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed mb-6">
              Every AGV unit is expected to generate $180k-$280k in annual revenue, with an IRR between 18% and 26%, based on actual orchard yields and regional solar performance data.
            </p>
            
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 leading-relaxed">
              We combine China's world-leading agricultural and solar assets with modular SPV tokenization and on-chain data architecture, making every physical unit digitally verifiable, yield-bearing, and DeFi-compatible.
            </p>
          </div>
        </div>
        
        {/* Conceptual Graphic in Rounded Frame */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-slate-700/50 p-6 sm:p-8 relative overflow-hidden">
            {/* Frame background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-teal-900/20 rounded-2xl sm:rounded-3xl"></div>
            
            {/* Graphic Content */}
            <div className="relative h-64 sm:h-80 lg:h-96 flex items-center justify-center">
              {/* Background circuit pattern */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <g key={i}>
                      <line
                        x1={`${Math.random() * 100}%`}
                        y1={`${Math.random() * 100}%`}
                        x2={`${Math.random() * 100}%`}
                        y2={`${Math.random() * 100}%`}
                        stroke="#60a5fa"
                        strokeWidth="0.5"
                        opacity="0.3"
                      />
                      <circle
                        cx={`${Math.random() * 100}%`}
                        cy={`${Math.random() * 100}%`}
                        r="0.5"
                        fill="#34d399"
                        opacity="0.4"
                      />
                    </g>
                  ))}
                </svg>
              </div>
              
              {/* Glowing Cubes Cluster */}
              <div className="relative flex items-center justify-center">
                {/* Central Large Cube */}
                <div className="relative z-20">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500/40 to-teal-500/40 border border-blue-400/60 rounded-lg transform rotate-12 shadow-2xl shadow-blue-500/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-transparent rounded-lg"></div>
                    {/* Circuit pattern overlay */}
                    <div className="absolute inset-0 opacity-60">
                      <svg className="w-full h-full">
                        <rect x="3" y="3" width="3" height="3" fill="#60a5fa" />
                        <rect x="9" y="9" width="3" height="3" fill="#34d399" />
                        <rect x="3" y="9" width="3" height="3" fill="#60a5fa" />
                        <rect x="9" y="3" width="3" height="3" fill="#34d399" />
                        <line x1="1" y1="6" x2="14" y2="6" stroke="#60a5fa" strokeWidth="0.5" />
                        <line x1="6" y1="1" x2="6" y2="14" stroke="#34d399" strokeWidth="0.5" />
                        <circle cx="6" cy="6" r="1" fill="#60a5fa" />
                      </svg>
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-blue-400/20 rounded-lg animate-pulse"></div>
                  </div>
                </div>
                
                {/* Smaller Cubes around */}
                <div className="absolute -top-4 -left-4 z-10">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-teal-500/40 to-green-500/40 border border-teal-400/60 rounded-md transform -rotate-12 shadow-lg shadow-teal-500/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-400/30 to-transparent rounded-md"></div>
                    <div className="absolute inset-0 opacity-50">
                      <svg className="w-full h-full">
                        <rect x="2" y="2" width="2" height="2" fill="#34d399" />
                        <rect x="6" y="6" width="2" height="2" fill="#60a5fa" />
                        <line x1="1" y1="4" x2="7" y2="4" stroke="#34d399" strokeWidth="0.5" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-teal-400/20 rounded-md animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                </div>
                
                <div className="absolute -bottom-2 -right-2 z-10">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-green-500/40 to-blue-500/40 border border-green-400/60 rounded-md transform rotate-45 shadow-lg shadow-green-500/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-transparent rounded-md"></div>
                    <div className="absolute inset-0 opacity-50">
                      <svg className="w-full h-full">
                        <rect x="1" y="1" width="2" height="2" fill="#34d399" />
                        <rect x="5" y="5" width="2" height="2" fill="#60a5fa" />
                        <line x1="1" y1="3" x2="7" y2="3" stroke="#34d399" strokeWidth="0.5" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-green-400/20 rounded-md animate-pulse" style={{ animationDelay: '1s' }}></div>
                  </div>
                </div>
                
                <div className="absolute top-2 -right-6 z-10">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500/40 to-teal-500/40 border border-blue-400/60 rounded-sm transform -rotate-30 shadow-lg shadow-blue-500/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-transparent rounded-sm"></div>
                    <div className="absolute inset-0 opacity-50">
                      <svg className="w-full h-full">
                        <rect x="1" y="1" width="1" height="1" fill="#60a5fa" />
                        <rect x="3" y="3" width="1" height="1" fill="#34d399" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-blue-400/20 rounded-sm animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                  </div>
                </div>
              </div>
              
              {/* Tree emerging from central cube */}
              <div className="absolute z-30">
                {/* Tree trunk */}
                <div className="w-3 sm:w-4 lg:w-5 h-12 sm:h-16 lg:h-20 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-lg"></div>
                
                {/* Tree canopy */}
                <div className="absolute -top-6 sm:-top-8 lg:-top-10 -left-6 sm:-left-8 lg:-left-10 w-12 sm:w-16 lg:w-20 h-12 sm:h-16 lg:h-20">
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-700 rounded-full relative overflow-hidden">
                    {/* Leaves pattern */}
                    <div className="absolute inset-0">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-green-400 rounded-full opacity-60"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                          }}
                        />
                      ))}
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-transparent rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Additional floating light particles */}
              <div className="absolute inset-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-40 animate-pulse"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${1.5 + Math.random() * 1}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

