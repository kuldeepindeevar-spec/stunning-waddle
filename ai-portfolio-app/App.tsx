/**
 * App shell: safe areas, the account bar, tab switching and the position
 * detail overlay. All market state lives in useMarketData so every tab reads
 * the same marks at the same instant.
 */

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from './src/theme';
import { StatusStrip, TopBar } from './src/components/TopBar';
import { TabBar, TabKey } from './src/components/TabBar';
import { PortfolioScreen } from './src/screens/PortfolioScreen';
import { PositionDetailScreen } from './src/screens/PositionDetailScreen';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { AuditScreen } from './src/screens/AuditScreen';
import { WatchlistScreen } from './src/screens/WatchlistScreen';
import { useMarketData } from './src/hooks/useMarketData';
import { ACCOUNT } from './src/data/ledger';

const TAB_SUBTITLE: Record<TabKey, string> = {
  portfolio: ACCOUNT.title,
  watchlist: 'WATCHLIST · AI VALUE CHAIN',
  activity: 'ACTIVITY · FULL STATEMENT',
  audit: 'AUDIT · RECONCILIATION',
};

const Shell = () => {
  const insets = useSafeAreaInsets();
  const data = useMarketData();
  const [tab, setTab] = useState<TabKey>('portfolio');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <TopBar subtitle={selected ? 'POSITION DETAIL' : TAB_SUBTITLE[tab]} />
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
          <PortfolioScreen data={data} onSelect={setSelected} />
        ) : tab === 'watchlist' ? (
          <WatchlistScreen data={data} />
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
});
