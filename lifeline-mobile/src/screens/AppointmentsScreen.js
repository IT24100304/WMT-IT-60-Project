import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import { CheckCircle2, FlaskConical, RefreshCcw, XCircle } from 'lucide-react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 8;
const STATUS_ORDER = ['Scheduled', 'Approved', 'Completed', 'Cancelled'];
const STATUS_LABELS = {
    Scheduled: 'Requested',
    Approved: 'Approved',
    Completed: 'Finished',
    Cancelled: 'Cancelled'
};

const getStatusStyle = (status) => {
    switch (status) {
        case 'Scheduled':
            return { bg: '#E0F2FE', text: '#0C4A6E' };
        case 'Approved':
            return { bg: '#DCFCE7', text: '#166534' };
        case 'Completed':
            return { bg: '#F3E8FF', text: '#6B21A8' };
        case 'Cancelled':
            return { bg: '#FEE2E2', text: '#991B1B' };
        default:
            return { bg: '#E2E8F0', text: '#334155' };
    }
};

const formatAppointmentDate = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Invalid date' : parsed.toLocaleString();
};

export default function AppointmentsScreen({ navigation }) {
    const { user, canApproveAppointments } = useAuth();
    const currentUserId = user?.id || user?.userId;

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState('Scheduled');
    const [tabPages, setTabPages] = useState({});

    const fetchAppointments = async () => {
        if (!canApproveAppointments && !currentUserId) {
            setAppointments([]);
            setLoading(false);
            setError(false);
            return;
        }

        setLoading(true);
        setError(false);
        try {
            const url = canApproveAppointments ? '/api/appointments' : `/api/appointments/donor/${currentUserId}`;
            const res = await api.get(url);
            setAppointments(res.data || []);
        } catch (err) {
            console.error('Error fetching appointments', err);
            setAppointments([]);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [canApproveAppointments, currentUserId]);

    const normalizedAppointments = useMemo(() => {
        return appointments
            .map((appt) => {
                const status = appt.status || 'Scheduled';
                const centerType = appt.centerType || (appt.hospitalId > 100 ? 'CAMP' : 'HOSPITAL');
                const centerName = appt.centerName || (centerType === 'CAMP' ? `Camp #${appt.hospitalId}` : `Hospital #${appt.hospitalId}`);
                const parsedDate = new Date(appt.date);
                const ts = Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();

                return {
                    ...appt,
                    status,
                    centerType,
                    centerName,
                    ts,
                    formattedDate: formatAppointmentDate(appt.date)
                };
            })
            .sort((a, b) => b.ts - a.ts);
    }, [appointments]);

    const matchesSearch = (appt) => {
        if (!searchText.trim()) return true;
        const search = searchText.trim().toLowerCase();

        return (
            String(appt.id || '').toLowerCase().includes(search) ||
            String(appt.donorUserId || '').toLowerCase().includes(search) ||
            (appt.centerName || '').toLowerCase().includes(search) ||
            (appt.donorName || '').toLowerCase().includes(search) ||
            (appt.status || '').toLowerCase().includes(search)
        );
    };

    const groupedAppointments = useMemo(() => {
        const grouped = Object.fromEntries(STATUS_ORDER.map((status) => [status, []]));

        normalizedAppointments.forEach((appt) => {
            if (!grouped[appt.status]) grouped[appt.status] = [];
            grouped[appt.status].push(appt);
        });

        return grouped;
    }, [normalizedAppointments]);

    const visibleAppointments = useMemo(() => {
        const all = (groupedAppointments[activeTab] || []).filter(matchesSearch);
        const page = tabPages[activeTab] || 1;
        return {
            all,
            page,
            visible: all.slice(0, page * PAGE_SIZE)
        };
    }, [activeTab, groupedAppointments, searchText, tabPages]);

    const handleUpdateStatus = async (id, status) => {
        if (updatingId) return;
        setUpdatingId(id);

        const isDonorCancellation = status === 'Cancelled' && !canApproveAppointments;
        const endpoint = isDonorCancellation ? `/api/appointments/${id}/cancel` : `/api/appointments/${id}/status`;
        const payload = isDonorCancellation ? {} : { status, actingUserId: currentUserId };

        try {
            await api.put(endpoint, payload);

            if (status === 'Approved') {
                Alert.alert('Status updated', 'This booking has been approved.');
            } else if (status === 'Completed') {
                Alert.alert('Status updated', 'Donation marked as finished. The blood bag is now available for lab processing.');
            } else if (status === 'Cancelled') {
                Alert.alert('Status updated', canApproveAppointments ? 'The booking has been rejected.' : 'Your booking has been cancelled.');
            }

            await fetchAppointments();
        } catch (err) {
            console.error('Error updating appointment', err);
            Alert.alert('Error', 'Unable to update appointment.');
        } finally {
            setUpdatingId(null);
        }
    };

    const confirmUpdate = (id, status, title, description) => {
        Alert.alert(title, description, [
            { text: 'Keep', style: 'cancel' },
            { text: 'Confirm', onPress: () => handleUpdateStatus(id, status) }
        ]);
    };

    const setPage = (statusKey, page) => {
        setTabPages((prev) => ({ ...prev, [statusKey]: page }));
    };

    const { all, page, visible } = visibleAppointments;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.kicker}>Scheduling</Text>
                        <Text style={styles.title}>{canApproveAppointments ? 'Scheduled Bookings' : 'My Bookings'}</Text>
                        <Text style={styles.subtitle}>
                            {canApproveAppointments ? 'Review requests, approvals, completions, and cancellations.' : 'Manage your donation bookings and check status updates.'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchAppointments} disabled={loading}>
                        <RefreshCcw size={18} color="#334155" />
                    </TouchableOpacity>
                </View>

                {!canApproveAppointments && (
                    <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('BookAppointment')}>
                        <Text style={styles.bookBtnText}>Book New Appointment</Text>
                    </TouchableOpacity>
                )}

                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by ID, donor, center, or status..."
                    placeholderTextColor="#94A3B8"
                    value={searchText}
                    onChangeText={(value) => {
                        setSearchText(value);
                        setTabPages({});
                    }}
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
                    {STATUS_ORDER.map((tab) => {
                        const count = (groupedAppointments[tab] || []).filter(matchesSearch).length;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.tabActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                    {STATUS_LABELS[tab]} ({count})
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.stateWrap}>
                    <ActivityIndicator size="large" color="#E11D48" />
                    <Text style={styles.stateText}>Loading appointments...</Text>
                </View>
            ) : error ? (
                <View style={styles.stateWrap}>
                    <Text style={styles.stateTitle}>Unable to load appointments</Text>
                    <Text style={styles.stateText}>Please refresh and try again.</Text>
                </View>
            ) : appointments.length === 0 ? (
                <View style={styles.stateWrap}>
                    <Text style={styles.stateTitle}>No appointments found</Text>
                    <Text style={styles.stateText}>Bookings will appear here once they are created.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list}>
                    {all.length === 0 ? (
                        <View style={styles.stateWrapCompact}>
                            <Text style={styles.stateTitle}>No matching bookings</Text>
                            <Text style={styles.stateText}>Try a different search or switch status tabs.</Text>
                        </View>
                    ) : (
                        <>
                            {visible.map((appt) => {
                                const statusStyle = getStatusStyle(appt.status);
                                return (
                                    <View key={appt.id} style={styles.card}>
                                        <View style={styles.cardHeader}>
                                            <View style={styles.cardHeaderText}>
                                                <Text style={styles.apptId}>
                                                    Appointment #{appt.id} • {appt.centerType === 'CAMP' ? 'Camp' : 'Hospital'}
                                                </Text>
                                                <Text style={styles.centerName}>{appt.centerName}</Text>
                                            </View>
                                            <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                                                <Text style={[styles.badgeText, { color: statusStyle.text }]}>{appt.status.toUpperCase()}</Text>
                                            </View>
                                        </View>

                                        {canApproveAppointments && (
                                            <Text style={styles.metaText}>
                                                Donor: {appt.donorName || 'Unknown'} • ID {appt.donorUserId || 'N/A'}
                                            </Text>
                                        )}
                                        <Text style={styles.dateText}>{appt.formattedDate}</Text>

                                        <View style={styles.actions}>
                                            {!canApproveAppointments && appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                                                <TouchableOpacity
                                                    style={[styles.btn, styles.btnCancel]}
                                                    onPress={() => confirmUpdate(appt.id, 'Cancelled', 'Cancel booking?', 'This will cancel your donation appointment.')}
                                                    disabled={updatingId === appt.id}
                                                >
                                                    <XCircle size={16} color="#B91C1C" />
                                                    <Text style={styles.btnCancelText}>
                                                        {updatingId === appt.id ? 'Cancelling...' : 'Cancel Booking'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}

                                            {canApproveAppointments && appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                                                <>
                                                    <TouchableOpacity
                                                        style={[styles.btn, styles.btnApprove]}
                                                        onPress={() => confirmUpdate(appt.id, 'Approved', 'Approve booking?', 'Confirm this donor booking as approved.')}
                                                        disabled={updatingId === appt.id}
                                                    >
                                                        <CheckCircle2 size={16} color="#065F46" />
                                                        <Text style={styles.btnApproveText}>Approve</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={[styles.btn, styles.btnComplete]}
                                                        onPress={() => confirmUpdate(appt.id, 'Completed', 'Mark finished?', 'Use this after the donor successfully completes the donation.')}
                                                        disabled={updatingId === appt.id}
                                                    >
                                                        <FlaskConical size={16} color="#5B21B6" />
                                                        <Text style={styles.btnCompleteText}>Mark Finished</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={[styles.btn, styles.btnReject]}
                                                        onPress={() => confirmUpdate(appt.id, 'Cancelled', 'Reject booking?', 'This will reject and cancel the booking.')}
                                                        disabled={updatingId === appt.id}
                                                    >
                                                        <XCircle size={16} color="#B91C1C" />
                                                        <Text style={styles.btnCancelText}>Reject</Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}

                            <View style={styles.pagination}>
                                {page * PAGE_SIZE < all.length && (
                                    <TouchableOpacity style={styles.pageBtn} onPress={() => setPage(activeTab, page + 1)}>
                                        <Text style={styles.pageBtnText}>Show More ({all.length - page * PAGE_SIZE} remaining)</Text>
                                    </TouchableOpacity>
                                )}

                                {page > 1 && (
                                    <TouchableOpacity style={styles.pageBtn} onPress={() => setPage(activeTab, 1)}>
                                        <Text style={styles.pageBtnText}>Show Less</Text>
                                    </TouchableOpacity>
                                )}

                                {all.length > PAGE_SIZE && (
                                    <Text style={styles.paginationText}>
                                        Showing {Math.min(page * PAGE_SIZE, all.length)} of {all.length}
                                    </Text>
                                )}
                            </View>
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4FF' },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0'
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
        gap: 12
    },
    headerTextWrap: { flex: 1 },
    kicker: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        color: '#E11D48',
        marginBottom: 4
    },
    title: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
    subtitle: { fontSize: 13, lineHeight: 19, color: '#64748B' },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC'
    },
    bookBtn: {
        backgroundColor: '#E11D48',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 14
    },
    bookBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    searchInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#1E293B',
        marginBottom: 14
    },
    tabScroll: { paddingRight: 12 },
    tab: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        marginRight: 8,
        backgroundColor: '#F1F5F9'
    },
    tabActive: { backgroundColor: '#E11D48' },
    tabText: { color: '#64748B', fontWeight: '700', fontSize: 12 },
    tabTextActive: { color: '#FFFFFF' },
    list: { padding: 20, paddingBottom: 32 },
    stateWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28
    },
    stateWrapCompact: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20
    },
    stateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8
    },
    stateText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 10
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 8
    },
    cardHeaderText: { flex: 1 },
    apptId: { color: '#64748B', fontSize: 13, fontWeight: '700', marginBottom: 4 },
    centerName: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    badgeText: { fontSize: 10, fontWeight: '800' },
    metaText: { color: '#475569', fontSize: 13, marginBottom: 4 },
    dateText: { color: '#94A3B8', fontSize: 13, marginBottom: 16 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: 1
    },
    btnCancel: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
    btnReject: { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
    btnApprove: { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
    btnComplete: { borderColor: '#C4B5FD', backgroundColor: '#F5F3FF' },
    btnCancelText: { color: '#B91C1C', fontWeight: '700', fontSize: 13 },
    btnApproveText: { color: '#065F46', fontWeight: '700', fontSize: 13 },
    btnCompleteText: { color: '#5B21B6', fontWeight: '700', fontSize: 13 },
    pagination: { marginTop: 6, alignItems: 'flex-start', gap: 10 },
    pageBtn: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 9
    },
    pageBtnText: { color: '#334155', fontSize: 13, fontWeight: '600' },
    paginationText: { color: '#64748B', fontSize: 12 }
});
