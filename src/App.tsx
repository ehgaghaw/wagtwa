import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SolanaProvider from "./providers/SolanaProvider";
import Header from "./components/Header";
import Footer from "./components/Footer";
import TickerBar from "./components/TickerBar";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import CoinDetail from "./pages/CoinDetail";
import LaunchCoin from "./pages/LaunchCoin";
import Characters from "./pages/Characters";

import CreateCharacter from "./pages/CreateCharacter";
import Portfolio from "./pages/Portfolio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SolanaProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Header />
            <TickerBar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/coin/:id" element={<CoinDetail />} />
                <Route path="/token/:mintAddress" element={<CoinDetail />} />
                <Route path="/launch" element={<LaunchCoin />} />
                <Route path="/characters" element={<Characters />} />
                
                <Route path="/create-character" element={<CreateCharacter />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </SolanaProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
