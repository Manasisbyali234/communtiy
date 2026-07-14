import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import WeatherWidget from '../components/common/WeatherWidget';
import { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

// ── Data ─────────────────────────────────────────────────────────────────────

const SERVICES = [
  { id: 'tractor',    icon: 'construct-outline',     label: 'Traction',                   color: '#F57F17' },
  { id: 'ledger',     icon: 'book-outline',          label: 'Add Ledger',                 color: '#00695C' },
  { id: 'price',      icon: 'calculator-outline',    label: 'Price Calculator',           color: '#6A1B9A' },
  { id: 'market',     icon: 'trending-up-outline',   label: 'Market Rates',               color: '#C62828' },
];

const SCHEMES = [
  { id: 'pmkisan',  icon: 'cash-outline',             label: 'PM-Kisan',                  color: '#2E7D32', bg: '#EAF7EC' },
  { id: 'shc',      icon: 'layers-outline',           label: 'Soil Health Card',           color: '#6D4C41', bg: '#F4EEEB' },
  { id: 'pmfby',    icon: 'shield-checkmark-outline', label: 'PMFBY (Crop Insurance)',     color: '#1565C0', bg: '#EAF4FF' },
  { id: 'kcc',      icon: 'card-outline',             label: 'Kisan Credit Card',          color: '#6A1B9A', bg: '#EFE9FF' },
];



// ── Component ─────────────────────────────────────────────────────────────────

export default function KrushiMitraScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showCalc, setShowCalc] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [extraKg, setExtraKg] = useState('');
  const [extraKgRate, setExtraKgRate] = useState('');

  const qty = parseFloat(quantity) || 0;
  const rate = parseFloat(ratePerUnit) || 0;
  const extra = parseFloat(extraKg) || 0;
  const extraRate = parseFloat(extraKgRate) || 0;
  const baseAmount = qty * rate;
  const extraAmount = extra * extraRate;
  const totalAmount = baseAmount + extraAmount;
  const hasResult = qty > 0 && rate > 0;
  const resetCalc = () => { setQuantity(''); setRatePerUnit(''); setExtraKg(''); setExtraKgRate(''); };

  const filteredServices = SERVICES.filter((s) =>
    s.label.toLowerCase().includes(search.toLowerCase())
  );

  // ── Sub-renders ────────────────────────────────────────────────────────────

  const WelcomeCard = (
    <LinearGradient
      colors={['#1B5E20', '#2D6A2D', '#43A047']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.welcomeCard}
    >
      {/* Decorative circles */}
      <View style={styles.wCircle1} />
      <View style={styles.wCircle2} />

      <View style={styles.welcomeLeft}>
        <Text style={styles.welcomeTitle}>Welcome to{'\n'}Krushi Mitra</Text>
        <Text style={styles.welcomeSub}>Your Digital Farming Assistant</Text>
        <View style={styles.welcomeBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#FFF" />
          <Text style={styles.welcomeBadgeText}>Govt. Verified</Text>
        </View>
      </View>

      <View style={styles.welcomeRight}>
        <View style={styles.farmIllustration}>
          <Ionicons name="leaf" size={44} color="rgba(255,255,255,0.9)" />
          <View style={styles.farmIconRow}>
            <Ionicons name="sunny" size={20} color="#FFD54F" />
            <Ionicons name="water" size={20} color="#81D4FA" style={{ marginLeft: 6 }} />
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  const ServicesSection = (
    <View style={{ marginBottom: 20 }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesRow}>
        {filteredServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            activeOpacity={0.75}
            style={[styles.serviceCard, { backgroundColor: colors.surface }]}
            onPress={() => {
              if (service.id === 'price') setShowCalc(true);
              else if (service.id === 'market') router.push('/market-rates' as any);
            }}
          >
            <View style={[styles.serviceIconWrap, { backgroundColor: service.color + '18' }]}>
              <Ionicons name={service.icon as any} size={26} color={service.color} />
            </View>
            <Text style={[styles.serviceLabel, { color: colors.text }]}>{service.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const SeasonalAdvisory = (
    <View style={[styles.seasonalCard, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '40' }]}>
      <View style={styles.seasonalHeader}>
        <View style={[styles.seasonalBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="sunny-outline" size={14} color="#FFF" />
          <Text style={styles.seasonalBadgeText}>Kharif Season</Text>
        </View>
      </View>
      <Text style={[styles.seasonalTitle, { color: colors.primaryDark }]}>Seasonal Advisory</Text>
      {['Prepare fields with deep ploughing', 'Buy quality certified seeds', 'Check weather before sowing'].map((tip, i) => (
        <View key={i} style={styles.tipRow}>
          <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
        </View>
      ))}
      <TouchableOpacity style={[styles.learnMoreBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
        <Text style={styles.learnMoreText}>Learn More</Text>
        <Ionicons name="arrow-forward" size={14} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  const GovernmentSchemes = (
    <View style={styles.schemesSection}>
      {/* Header row */}
      <View style={styles.schemesHeader}>
        <View>
          <Text style={styles.schemesTitle}>Government Schemes</Text>
          <Text style={styles.schemesSubtitle}>Useful portals for farmers</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Single row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.schemesRow}>
        {SCHEMES.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            style={styles.schemeCardNew}
          >
            <View style={[styles.schemeIconWrapNew, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon as any} size={34} color={item.color} />
            </View>
            <Text style={styles.schemeLabelNew}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );



  const PriceCalculatorModal = (
    <Modal visible={showCalc} transparent animationType="slide" onRequestClose={() => setShowCalc(false)}>
      <TouchableWithoutFeedback onPress={() => setShowCalc(false)}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalSheet}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <View style={styles.modalHeader}>
            <View style={[styles.modalIconWrap, { backgroundColor: '#6A1B9A18' }]}>
              <Ionicons name="calculator-outline" size={22} color="#6A1B9A" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Price Calculator</Text>
            <TouchableOpacity onPress={() => setShowCalc(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={[styles.calcCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {[
                { label: 'Quantity (bags / units)', placeholder: 'e.g. 10', value: quantity, setter: setQuantity, prefix: undefined, suffix: undefined },
                { label: 'Rate per unit (\u20b9 / 20 kg)', placeholder: 'e.g. 500', value: ratePerUnit, setter: setRatePerUnit, prefix: '\u20b9', suffix: '/ 20 kg' },
                { label: 'Extra kg', placeholder: 'e.g. 5', value: extraKg, setter: setExtraKg, prefix: undefined, suffix: undefined },
                { label: 'Extra kg rate (\u20b9 per kg)', placeholder: 'e.g. 25', value: extraKgRate, setter: setExtraKgRate, prefix: '\u20b9', suffix: '/ kg' },
              ].map((f, i) => (
                <View key={i} style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{f.label}</Text>
                  <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {f.prefix && <Text style={[styles.affix, { color: colors.textMuted }]}>{f.prefix}</Text>}
                    <TextInput
                      style={[styles.calcInput, { color: colors.text }]}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={f.value}
                      onChangeText={f.setter}
                    />
                    {f.suffix && <Text style={[styles.affix, { color: colors.textMuted }]}>{f.suffix}</Text>}
                  </View>
                </View>
              ))}
            </View>
            {hasResult && (
              <View style={[styles.resultCard, { backgroundColor: colors.primaryContainer, borderColor: colors.primary + '40' }]}>
                <Text style={[styles.resultTitle, { color: colors.primaryDark }]}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Base Amount</Text>
                  <Text style={[styles.summaryValue, { color: colors.primaryDark }]}>{`\u20b9 ${baseAmount.toFixed(2)}`}</Text>
                </View>
                {extra > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Extra kg Amount</Text>
                    <Text style={[styles.summaryValue, { color: colors.primaryDark }]}>{`\u20b9 ${extraAmount.toFixed(2)}`}</Text>
                  </View>
                )}
                <View style={[styles.divider, { backgroundColor: colors.primary + '30' }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.totalLabel, { color: colors.primaryDark }]}>Total Amount</Text>
                  <Text style={[styles.totalValue, { color: colors.primary }]}>{`\u20b9 ${totalAmount.toFixed(2)}`}</Text>
                </View>
              </View>
            )}
            {(quantity || ratePerUnit || extraKg || extraKgRate) ? (
              <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]} onPress={resetCalc} activeOpacity={0.7}>
                <Ionicons name="refresh-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.resetText, { color: colors.textMuted }]}>Reset</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const ListData = [
    { key: 'welcome' },
    { key: 'services' },
    { key: 'seasonal' },
    { key: 'schemes' },
    { key: 'weather' },
  ];

  const renderItem = ({ item }: { item: { key: string } }) => {
    switch (item.key) {
      case 'welcome':   return WelcomeCard;
      case 'services':  return ServicesSection;
      case 'seasonal':  return SeasonalAdvisory;
      case 'schemes':   return GovernmentSchemes;
      case 'weather':   return <View style={{ marginTop: 24 }}><WeatherWidget /></View>;
      default:          return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="leaf" size={20} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>Krushi Mitra</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="notifications-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search services..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {PriceCalculatorModal}

      {/* Content */}
      <FlatList
        data={ListData}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  notifBtn: { width: 40, alignItems: 'flex-end' },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  // Welcome Card
  welcomeCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  wCircle1: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.07)', top: -30, right: 60,
  },
  wCircle2: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, right: 10,
  },
  welcomeLeft: { flex: 1 },
  welcomeTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', lineHeight: 26, letterSpacing: -0.4 },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500', marginTop: 6 },
  welcomeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginTop: 12,
  },
  welcomeBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  welcomeRight: { marginLeft: 12 },
  farmIllustration: { alignItems: 'center', gap: 6 },
  farmIconRow: { flexDirection: 'row', alignItems: 'center' },

  // Section Title
  sectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, marginBottom: 12 },

  // Services
  servicesRow: { flexDirection: 'row', gap: 12, paddingRight: 4 },
  serviceCard: {
    width: 120,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  serviceIconWrap: { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  serviceLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18, marginTop: 12 },

  // Seasonal Advisory
  seasonalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  seasonalHeader: { marginBottom: 8 },
  seasonalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  seasonalBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  seasonalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, letterSpacing: -0.3 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3 },
  tipText: { fontSize: 13, flex: 1, lineHeight: 18 },
  learnMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12, marginTop: 4,
  },
  learnMoreText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  // Government Schemes (legacy — kept for safety)
  schemeCard: { borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center', width: 110, gap: 8 },
  schemeIconWrap: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  schemeLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 15 },

  // Government Schemes — redesigned
  schemesSection: {
    backgroundColor: '#FAFAFA',
    paddingVertical: 24,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  schemesHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  schemesTitle: { fontSize: 18, fontWeight: '700', color: '#222', letterSpacing: -0.3 },
  schemesSubtitle: { fontSize: 13, color: '#888', marginTop: 3 },
  viewAllText: { fontSize: 14, fontWeight: '700', color: '#2E7D32', marginTop: 4 },
  schemesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  schemesRow: { flexDirection: 'row', gap: 12, paddingRight: 4 },
  schemeCardNew: {
    width: 120,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  schemeIconWrapNew: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemeLabelNew: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 14,
  },



  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  modalIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '800' },
  calcCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 14, marginBottom: 14 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  calcInput: { flex: 1, fontSize: 15, padding: 0 },
  affix: { fontSize: 13, fontWeight: '600' },
  resultCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10, marginBottom: 14 },
  resultTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, marginVertical: 4 },
  totalLabel: { fontSize: 16, fontWeight: '800' },
  totalValue: { fontSize: 20, fontWeight: '900' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  resetText: { fontSize: 13, fontWeight: '600' },
});
