/**
 * Reports screen — hub for all 4 add-on reports.
 *
 * Career, 대운 Full (+ PDF export), Name Analysis generated inline.
 * Compatibility links to /compatibility screen.
 * Each report is gated behind its addon entitlement.
 */
import { useState, type ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  CompatibilityIcon,
  AnnualReportIcon,
  MyChartIcon,
  FortuneIcon,
} from '../../src/components/icons';
import { useTranslation } from 'react-i18next';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEntitlementStore } from '../../src/store/entitlementStore';
import { useAddonReport, useCachedAddonReport } from '../../src/hooks/useAddonReport';
import { useSajuStore } from '../../src/store/sajuStore';
import type { AddonReportType, AddonReport, ReportSection } from '../../src/hooks/useAddonReport';

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ section, index }: { section: ReportSection; index: number }) {
  const accents = ['#7c3aed', '#a855f7', '#9333ea', '#6d28d9', '#8b5cf6', '#7c3aed', '#a855f7', '#9333ea'];
  return (
    <View style={sStyles.card}>
      <View style={[sStyles.bar, { backgroundColor: accents[index % accents.length] }]} />
      <View style={sStyles.body}>
        <Text style={sStyles.heading}>{section.heading}</Text>
        <Text style={sStyles.content}>{section.content}</Text>
      </View>
    </View>
  );
}

const sStyles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#2d1854', borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  bar: { width: 4 },
  body: { flex: 1, padding: 14 },
  heading: { fontSize: 13, fontWeight: '700', color: '#d8b4fe', marginBottom: 6 },
  content: { fontSize: 13, color: '#b8a9d9', lineHeight: 20 },
});

// ── Report result panel ───────────────────────────────────────────────────────

function ReportResult({
  report,
  onReset,
  showPdfExport,
}: {
  report: AddonReport;
  onReset?: () => void;
  showPdfExport?: boolean;
}) {
  const { t } = useTranslation('common');
  const [exporting, setExporting] = useState(false);

  async function handleExportPdf() {
    setExporting(true);
    try {
      const sectionsHtml = report.sections
        .map(
          (s) => `
          <div style="margin-bottom:24px">
            <h3 style="color:#7c3aed;font-size:16px;margin-bottom:8px">${s.heading}</h3>
            <p style="color:#333;font-size:14px;line-height:1.7;margin:0">${s.content}</p>
          </div>`,
        )
        .join('');

      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;padding:40px;background:#fff;}
  h1{color:#1a0a2e;font-size:26px;margin-bottom:8px;}
  .overview{color:#555;font-size:15px;line-height:1.6;margin-bottom:32px;border-left:4px solid #7c3aed;padding-left:16px;}
  .footer{margin-top:40px;color:#999;font-size:11px;text-align:center;}
</style></head>
<body>
  <h1>${report.title}</h1>
  <div class="overview">${report.overview}</div>
  ${sectionsHtml}
  <div class="footer">${t('reports.pdfFooter')}</div>
</body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${report.title} — K-Saju`,
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (e) {
      console.warn('PDF export failed:', e);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <View style={rStyles.header}>
        <Text style={rStyles.title}>{report.title}</Text>
        <Text style={rStyles.overview}>{report.overview}</Text>
      </View>

      {report.sections.map((s, i) => (
        <SectionCard key={i} section={s} index={i} />
      ))}

      <View style={rStyles.actions}>
        {showPdfExport && (
          <TouchableOpacity
            style={[rStyles.pdfBtn, exporting && rStyles.btnDisabled]}
            onPress={handleExportPdf}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={rStyles.pdfBtnText}>{t('reports.exportPdf')}</Text>
            )}
          </TouchableOpacity>
        )}
        {onReset && (
          <TouchableOpacity style={rStyles.resetBtn} onPress={onReset}>
            <Text style={rStyles.resetText}>{t('reports.generateNew')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

const rStyles = StyleSheet.create({
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  overview: { fontSize: 14, color: '#b8a9d9', lineHeight: 22 },
  actions: { marginTop: 8, gap: 12 },
  pdfBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pdfBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  resetBtn: { alignItems: 'center', paddingVertical: 12 },
  resetText: { color: '#7c3aed', fontWeight: '600', fontSize: 13 },
});

// ── Report card wrapper ───────────────────────────────────────────────────────

function ReportCard({
  icon,
  title,
  subtitle,
  desc,
  unlockPrice,
  isUnlocked,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  desc: string;
  unlockPrice: string;
  isUnlocked: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation('common');
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.header}>
        <View style={cardStyles.iconWrap}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.title}>{title}</Text>
          <Text style={cardStyles.subtitle}>{subtitle}</Text>
        </View>
        {!isUnlocked && <Text style={cardStyles.lock}>🔒</Text>}
      </View>
      <Text style={cardStyles.desc}>{desc}</Text>
      {isUnlocked ? children : (
        <TouchableOpacity style={cardStyles.unlockBtn} onPress={() => router.push('/paywall')}>
          <Text style={cardStyles.unlockText}>{t('reports.unlock', { price: unlockPrice })}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: '#2d1854', borderRadius: 20, padding: 22, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  iconWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 12, color: '#9d8fbe', marginTop: 2 },
  lock: { fontSize: 18 },
  desc: { fontSize: 13, color: '#b8a9d9', lineHeight: 20, marginBottom: 16 },
  unlockBtn: {
    backgroundColor: '#4c1d95',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unlockText: { color: '#d8b4fe', fontWeight: '700', fontSize: 14 },
});

// ── Generate button ───────────────────────────────────────────────────────────

function GenerateButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  const { t } = useTranslation('common');
  return (
    <TouchableOpacity
      style={[genStyles.btn, loading && genStyles.btnDisabled]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={genStyles.btnText}>{t('reports.generate')}</Text>
      )}
    </TouchableOpacity>
  );
}

const genStyles = StyleSheet.create({
  btn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ReportsScreen() {
  const { t } = useTranslation('common');
  const { addons } = useEntitlementStore();
  const { chart } = useSajuStore();

  // career & daewoon: multi-layer cached (Zustand → AsyncStorage → API, auto-generates)
  const career      = useCachedAddonReport('career',       addons.careerWealth);
  const daewoonFull = useCachedAddonReport('daewoon_full', addons.daewoonPdf);
  // name analysis: parameterized by user input, no auto-cache
  const nameReport  = useAddonReport();

  const [nameInput, setNameInput] = useState('');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← {t('back')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('reports.title')}</Text>
      <Text style={styles.subtitle}>{t('reports.subtitle')}</Text>

      {!chart && (
        <View style={styles.noChart}>
          <Text style={styles.noChartText}>{t('reports.noChart')}</Text>
        </View>
      )}

      {/* ── 1. Compatibility ──────────────────────────────────────────────── */}
      <ReportCard
        icon={<CompatibilityIcon color="#C9A84C" size={32} />}
        title={t('reports.deepCompatibility.title')}
        subtitle={t('reports.deepCompatibility.subtitle')}
        desc={t('reports.deepCompatibility.desc')}
        unlockPrice="$4.99"
        isUnlocked={addons.deepCompatibility}
      >
        <TouchableOpacity
          style={cardStyles.unlockBtn}
          onPress={() => router.push('/compatibility')}
        >
          <Text style={[cardStyles.unlockText, { color: '#a78bfa' }]}>{t('reports.openCompatibility')}</Text>
        </TouchableOpacity>
      </ReportCard>

      {/* ── 2. Career & Wealth ────────────────────────────────────────────── */}
      <ReportCard
        icon={<AnnualReportIcon color="#C9A84C" size={32} />}
        title={t('reports.careerWealth.title')}
        subtitle={t('reports.careerWealth.subtitle')}
        desc={t('reports.careerWealth.desc')}
        unlockPrice="$4.99"
        isUnlocked={addons.careerWealth}
      >
        {career.report ? (
          <ReportResult report={career.report} showPdfExport={false} />
        ) : career.loading ? (
          <View style={styles.generatingBox}>
            <ActivityIndicator color="#a78bfa" />
            <Text style={styles.generatingText}>{t('reports.generate')}…</Text>
          </View>
        ) : career.error ? (
          <>
            <Text style={styles.errorText}>{career.error}</Text>
            <GenerateButton onPress={career.generate} loading={false} />
          </>
        ) : null}
      </ReportCard>

      {/* ── 3. Full 대운 Report ───────────────────────────────────────────── */}
      <ReportCard
        icon={<MyChartIcon color="#C9A84C" size={32} />}
        title={t('reports.daewoonPdf.title')}
        subtitle={t('reports.daewoonPdf.subtitle')}
        desc={t('reports.daewoonPdf.desc')}
        unlockPrice="$6.99"
        isUnlocked={addons.daewoonPdf}
      >
        {daewoonFull.report ? (
          <ReportResult report={daewoonFull.report} showPdfExport />
        ) : daewoonFull.loading ? (
          <View style={styles.generatingBox}>
            <ActivityIndicator color="#a78bfa" />
            <Text style={styles.generatingText}>{t('reports.generate')}…</Text>
          </View>
        ) : daewoonFull.error ? (
          <>
            <Text style={styles.errorText}>{daewoonFull.error}</Text>
            <GenerateButton onPress={daewoonFull.generate} loading={false} />
          </>
        ) : null}
      </ReportCard>

      {/* ── 4. Name Analysis ─────────────────────────────────────────────── */}
      <ReportCard
        icon={<FortuneIcon color="#C9A84C" size={32} />}
        title={t('reports.nameAnalysis.title')}
        subtitle={t('reports.nameAnalysis.subtitle')}
        desc={t('reports.nameAnalysis.desc')}
        unlockPrice="$9.99"
        isUnlocked={addons.nameAnalysis}
      >
        {nameReport.report ? (
          <ReportResult
            report={nameReport.report}
            onReset={() => { nameReport.reset(); setNameInput(''); }}
          />
        ) : (
          <>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder={t('reports.nameAnalysis.placeholder')}
              placeholderTextColor="#5b4d7e"
            />
            {nameReport.error && (
              <Text style={styles.errorText}>{nameReport.error}</Text>
            )}
            <GenerateButton
              onPress={() => {
                if (!nameInput.trim()) return;
                nameReport.generate({ reportType: 'name_analysis', name: nameInput.trim() });
              }}
              loading={nameReport.loading}
            />
          </>
        )}
      </ReportCard>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a2e' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 24 },
  backText: { color: '#a78bfa', fontSize: 15 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9d8fbe', marginBottom: 28 },
  noChart: { backgroundColor: '#2d1854', borderRadius: 12, padding: 20, marginBottom: 20 },
  noChartText: { color: '#9d8fbe', textAlign: 'center', fontSize: 14 },
  errorText: { color: '#f87171', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  generatingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, justifyContent: 'center' },
  generatingText: { color: '#9d8fbe', fontSize: 13 },
  nameInput: {
    backgroundColor: '#1a0a2e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3d2471',
    marginBottom: 12,
  },
});
