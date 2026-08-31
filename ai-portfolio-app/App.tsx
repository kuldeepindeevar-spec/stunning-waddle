/**
 * App shell: safe areas, the title bar, the search filter, tab switching and
 * the position detail overlay. All market state lives in useMarketData so
 * every tab reads the same marks at the same instant.
 */

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from './src/theme';
import { StatusStrip, TopBar } from './src/components/TopBar';
import { TabBar, TabKey } from './src/components/TabBar';
import { PortfolioScreen } from './src/screens/PortfolioScreen';
import { PositionDetailScreen } from './src/screens/PositionDetailScreen';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { AuditScreen } from './src/screens/AuditScreen';
import { WatchlistScreen } from './src/screens/WatchlistScreen';
import { useMarketData } from './src/hooks/useMarketData';

const TITLES: Record<TabKey, string> = {
  portfolio: 'Portfolio',
  watchlist: 'Watchlist',
  activity: 'Activity',
  audit: 'Reports',
};

const Shell = () => {
  const insets = useSafeAreaInsets();
  const data = useMarketData();
  const [tab, setTab] = useState<TabKey>('portfolio');
  const [selected, setSelected] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const toggleSearch = () => {
    setSearchOpen((open) => {
      if (open) setQuery('');
      return !open;
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <TopBar
        // A stock detail screen is headed by its ticker, not a generic label.
        title={selected ?? TITLES[tab]}
        searchOpen={searchOpen}
        onToggleSearch={toggleSearch}
      />

      {searchOpen ? (
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Filter by symbol or name"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      ) : null}

      <StatusStrip
        live={data.feed.live}
        staleCount={data.feed.staleSymbols.size}
        lastUpdated={data.lastUpdated}
        refreshing={data.refreshing}
        onRefresh={data.refresh}
      />

      <View style={styles.body}>
        {selected ? (
          <PositionDetailScreen
            symbol={selected}
            portfolio={data.portfolio}
            onBack={() => setSelected(null)}
          />
        ) : tab === 'portfolio' ? (
          <PortfolioScreen data={data} query={query} onSelect={setSelected} />
        ) : tab === 'watchlist' ? (
          <WatchlistScreen data={data} query={query} onSelect={setSelected} />
        ) : tab === 'activity' ? (
          <ActivityScreen realizedPnl={data.portfolio.summary.realizedPnl} />
        ) : (
          <AuditScreen data={data} />
        )}
      </View>

      <TabBar
        active={tab}
        bottomInset={insets.bottom}
        onChange={(next) => {
          setSelected(null);
          setTab(next);
        }}
      />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  search: {
    backgroundColor: colors.chip,
    borderRadius: radius.control,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
});
