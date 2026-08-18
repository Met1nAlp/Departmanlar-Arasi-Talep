// src/screens/auth/PinSessionScreen.tsx
//
// Plan Bölüm 14.2, adım 3 ve Bölüm 17.1 "Personel Seçim Ekranı": yetkili
// girişi tamamlandıktan sonra, cihazı fiilen kullanacak personel kendini
// listeden seçer ve PIN girer. Klavye girişinden kaçınma kuralı (Plan
// Bölüm 4.3) burada da geçerli — PIN sayısal tuş takımıyla girilir.
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { User } from '../../types';
import { getTeamMembers } from '../../api/auth';

const KEYPAD_ROWS: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['temizle', '0', 'sil'],
];

const PIN_LENGTH = 4;

export default function PinSessionScreen() {
  const supervisor = useAuthStore((s) => s.supervisor);
  const logoutSupervisor = useAuthStore((s) => s.logoutSupervisor);
  const startStaffSession = useAuthStore((s) => s.startStaffSession);
  const authError = useAuthStore((s) => s.authError);
  const clearAuthError = useAuthStore((s) => s.clearAuthError);

  const [team, setTeam] = useState<User[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supervisor) return;
    getTeamMembers(supervisor.id).then((members) => {
      setTeam(members);
      setLoadingTeam(false);
    });
  }, [supervisor]);

  const handleKeyPress = (key: string) => {
    clearAuthError();
    if (key === 'sil') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === 'temizle') {
      setPin('');
      return;
    }
    setPin((p) => (p.length < PIN_LENGTH ? p + key : p));
  };

  useEffect(() => {
    if (!selectedMember || pin.length !== PIN_LENGTH || submitting) return;
    setSubmitting(true);
    startStaffSession(selectedMember.id, pin)
      .catch(() => {
        // Hata authStore.authError'a yazıldı; kullanıcı PIN'i tekrar girer.
        setPin('');
      })
      .finally(() => setSubmitting(false));
  }, [pin, selectedMember, submitting, startStaffSession]);

  if (loadingTeam) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  if (!selectedMember) {
    return (
      <View style={styles.container}>
        <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
          Kimsiniz?
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          {supervisor?.name} gözetiminde — listeden kendinizi seçin
        </Text>
        <ScrollView>
          {team.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberRow}
              onPress={() => setSelectedMember(member)}
            >
              <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>
                {member.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.logoutLink} onPress={() => logoutSupervisor()}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>Yetkili çıkışı</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
        {selectedMember.name}
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        PIN girin
      </Text>

      <View style={styles.pinDotsRow}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View key={i} style={[styles.pinDot, i < pin.length && styles.pinDotFilled]} />
        ))}
      </View>

      {authError && <Text style={styles.errorText}>{authError}</Text>}
      {submitting && <ActivityIndicator color={colors.blue} style={{ marginBottom: spacing.sm }} />}

      <View style={styles.keypad}>
        {KEYPAD_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.key}
                onPress={() => handleKeyPress(key)}
                disabled={submitting}
              >
                <Text style={[typography.h2, { color: colors.textPrimary }]}>
                  {key === 'sil' ? '⌫' : key === 'temizle' ? 'Temizle' : key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.backLink}
        onPress={() => {
          setSelectedMember(null);
          setPin('');
          clearAuthError();
        }}
      >
        <Text style={[typography.caption, { color: colors.textMuted }]}>← Kişi seçimine dön</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: spacing.lg },
  memberRow: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, minHeight: 64, justifyContent: 'center',
  },
  logoutLink: { alignSelf: 'center', marginTop: spacing.md, padding: spacing.sm },
  pinDotsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.lg },
  pinDot: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.blue,
    marginHorizontal: spacing.xs,
  },
  pinDotFilled: { backgroundColor: colors.blue },
  errorText: { color: '#B00020', textAlign: 'center', marginBottom: spacing.sm },
  keypad: { alignItems: 'center' },
  keypadRow: { flexDirection: 'row', marginBottom: spacing.sm },
  key: {
    width: 72, height: 64, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  backLink: { alignSelf: 'center', marginTop: spacing.md, padding: spacing.sm },
});
