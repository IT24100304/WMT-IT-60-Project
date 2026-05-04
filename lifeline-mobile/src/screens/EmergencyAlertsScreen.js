import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AlertTriangle, AlertCircle, Droplet, CheckCircle2, Activity, ArrowLeft } from 'lucide-react-native';
import api from '../services/api';

export default function EmergencyAlertsScreen({ navigation }) {
    const [activity, setActivity] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get('/api/activity/recent').then((r) => r.data || []).catch(() => []),
            api.get('/api/inventory/low-stock').then((r) => r.data || []).catch(() => [])
        ])
            .then(([activityData, stockData]) => {
                setActivity(activityData);
                setLowStock(stockData);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, []);

    const emergencyAlerts = useMemo(() => {
        return activity.filter((item) => {
            const type = (item.activityType || '').toUpperCase();
            const desc = (item.description || '').toLowerCase();
            return type.includes('EMERGENCY') || desc.includes('emergency alert');
        });
    }, [activity]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Dashboard')}>
                    <ArrowLeft size={18} color="#64748B" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Critical Alerts</Text>
                <Text style={styles.subtitle}>Low blood stock warnings and emergency request activity.</Text>
            </View>

            {loading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color="#E11D48" />
                    <Text style={styles.stateText}>Loading alerts...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerState}>
                    <Text style={styles.stateTitle}>Unable to load alerts</Text>
                    <Text style={styles.stateText}>Please try again from the dashboard.</Text>
                </View>
            ) : (
                <>
                    {lowStock.length > 0 ? (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Droplet size={20} color="#991B1B" />
                                <Text style={styles.sectionTitle}>Low Blood Stock Alerts</Text>
                            </View>
                            {lowStock.map((item) => {
                                const isCritical = item.level === 'CRITICAL' || item.units <= 5;
                                return (
                                    <View
                                        key={item.bloodType}
                                        style={[
                                            styles.alertCard,
                                            isCritical ? styles.criticalCard : styles.warningCard
                                        ]}
                                    >
                                        <View style={styles.alertIconWrap}>
                                            {isCritical ? (
                                                <AlertTriangle size={24} color="#DC2626" />
                                            ) : (
                                                <AlertCircle size={24} color="#D97706" />
                                            )}
                                        </View>
                                        <View style={styles.alertTextWrap}>
                                            <Text style={[styles.alertHeadline, isCritical ? styles.criticalText : styles.warningText]}>
                                                {item.bloodType} blood running {isCritical ? 'critically ' : ''}low
                                            </Text>
                                            <Text style={[styles.alertBody, isCritical ? styles.criticalText : styles.warningText]}>
                                                Only {item.units} unit{item.units !== 1 ? 's' : ''} remaining
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.successCard}>
                            <CheckCircle2 size={20} color="#059669" />
                            <Text style={styles.successText}>All blood types are currently at sufficient levels.</Text>
                        </View>
                    )}

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Activity size={20} color="#DC2626" />
                            <Text style={styles.sectionTitle}>Emergency Request Activity</Text>
                        </View>

                        {emergencyAlerts.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyTitle}>No emergency request alerts</Text>
                                <Text style={styles.emptyText}>There are no current emergency activities requiring attention.</Text>
                            </View>
                        ) : (
                            emergencyAlerts.map((alert) => (
                                <View key={alert.id} style={styles.feedCard}>
                                    <Text style={styles.feedTitle}>{alert.description}</Text>
                                    <Text style={styles.feedMeta}>Type: {alert.activityType || 'EMERGENCY'}</Text>
                                </View>
                            ))
                        )}
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4FF' },
    scroll: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 24 },
    backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 14 },
    backText: { marginLeft: 8, color: '#64748B', fontWeight: '700' },
    title: { fontSize: 28, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
    subtitle: { color: '#64748B', fontSize: 14, lineHeight: 20 },
    centerState: { paddingTop: 80, alignItems: 'center' },
    stateTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
    stateText: { color: '#64748B', textAlign: 'center', marginTop: 10 },
    section: { marginBottom: 22 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1
    },
    criticalCard: { backgroundColor: '#FFF5F5', borderColor: '#FCA5A5' },
    warningCard: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
    alertIconWrap: { marginRight: 12 },
    alertTextWrap: { flex: 1 },
    alertHeadline: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
    alertBody: { fontSize: 13, fontWeight: '600' },
    criticalText: { color: '#991B1B' },
    warningText: { color: '#92400E' },
    successCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#F0FDF4',
        borderColor: '#86EFAC',
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 22
    },
    successText: { color: '#065F46', fontWeight: '700', flex: 1 },
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
    emptyText: { color: '#64748B', lineHeight: 20 },
    feedCard: {
        backgroundColor: '#FFF5F5',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2'
    },
    feedTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
    feedMeta: { color: '#64748B', fontSize: 12, fontWeight: '600' }
});
