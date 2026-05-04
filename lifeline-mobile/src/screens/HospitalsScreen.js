import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, MapPin, Building2, Trash2, Edit2, Search, PlusCircle, Phone, Home, RefreshCw } from 'lucide-react-native';
import { PROVINCES, getDistrictsByProvince, getDefaultLocationSelection } from '../constants/locationData';
import { Picker } from '@react-native-picker/picker';

const PAGE_SIZE = 10;

export default function HospitalsScreen({ navigation }) {
    const { canManageCredentials } = useAuth(); // Super Admin
    const defaults = getDefaultLocationSelection();
    
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form config
    const [name, setName] = useState('');
    const [province, setProvince] = useState(defaults.province);
    const [district, setDistrict] = useState(defaults.district);
    const [address, setAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    // Search and Pagination
    const [searchText, setSearchText] = useState('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const districts = useMemo(() => getDistrictsByProvince(province), [province]);

    const fetchHospitals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/hospitals');
            setHospitals(res.data || []);
        } catch (err) {
            console.warn('Unable to load hospitals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHospitals();
    }, []);

    const resetForm = () => {
        setName('');
        setProvince(defaults.province);
        setDistrict(defaults.district);
        setAddress('');
        setContactNumber('');
        setEditingId(null);
        setShowForm(false);
    };

    const handleSaveHospital = async () => {
        if (!name || !province || !district) {
            return Alert.alert('Missing Info', 'Provide full regional location.');
        }

        setAdding(true);
        const payload = { name, province, district, address, contactNumber };
        try {
            if (editingId) {
                await api.put(`/api/hospitals/${editingId}`, payload);
                Alert.alert('Success', 'Hospital details updated.');
            } else {
                await api.post('/api/hospitals', payload);
                Alert.alert('Success', 'New hospital hub registered.');
            }
            resetForm();
            fetchHospitals();
        } catch (err) {
            Alert.alert('Error', err?.response?.data?.message || 'Unable to save hospital location.');
        } finally {
            setAdding(false);
        }
    };

    const openEdit = (h) => {
        setEditingId(h.id || h._id);
        setName(h.name || '');
        setProvince(h.province || defaults.province);
        setDistrict(h.district || h.district || defaults.district);
        setAddress(h.address || '');
        setContactNumber(h.contactNumber || '');
        setShowForm(true);
    };

    const confirmDelete = (id, hospName) => {
        Alert.alert('Delist Hospital', `Are you sure you want to remove ${hospName} from the database?`, [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Remove', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/api/hospitals/${id}`);
                        fetchHospitals();
                    } catch (e) {
                        Alert.alert('Error', 'Unable to delete hospital');
                    }
                }
            }
        ]);
    };

    const filteredHospitals = hospitals.filter(h => {
        const s = searchText.toLowerCase();
        return (
            (h.name || '').toLowerCase().includes(s) ||
            (h.district || '').toLowerCase().includes(s) ||
            (h.province || '').toLowerCase().includes(s) ||
            (h.address || '').toLowerCase().includes(s)
        );
    });

    const visibleHospitals = filteredHospitals.slice(0, visibleCount);

    // If not super-admin, restrict access
    if (!canManageCredentials) {
        return (
            <View style={styles.centerContainer}>
                <Stethoscope size={48} color="#DC2626" />
                <Text style={styles.unauthText}>Protected Module</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{marginTop: 20}}>
                    <Text style={{color: '#0F766E', fontWeight: 'bold'}}>Return to Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={fetchHospitals} style={styles.refreshBtn}>
                        <RefreshCw size={16} color="#0F766E" />
                        <Text style={styles.refreshText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.titleRow}>
                    <Stethoscope size={24} color="#1E293B" style={{marginRight: 8}} />
                    <Text style={styles.pageTitle}>Master Hospitals</Text>
                </View>
                <Text style={styles.subtitle}>Register regional hubs & centers</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <TouchableOpacity 
                    style={styles.addTrigger} 
                    onPress={() => { resetForm(); setShowForm(true); }}
                >
                    <PlusCircle size={20} color="#0F766E" />
                    <Text style={styles.addTriggerText}>Add New Medical Center</Text>
                </TouchableOpacity>

                <View style={styles.searchContainer}>
                    <Search size={20} color="#94A3B8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, location, address..."
                        value={searchText}
                        onChangeText={text => { setSearchText(text); setVisibleCount(PAGE_SIZE); }}
                    />
                </View>

                <Text style={styles.listTitle}>Whitelisted Nodes ({filteredHospitals.length})</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#0F766E" style={{marginTop: 20}} />
                ) : (
                    visibleHospitals.map(h => (
                        <View key={h.id || h._id} style={styles.hCard}>
                            <View style={styles.hInfo}>
                                <Text style={styles.hName}>{h.name}</Text>
                                <View style={styles.hLocationRow}>
                                    <MapPin size={12} color="#64748B" />
                                    <Text style={styles.hLocation}>{h.district}, {h.province}</Text>
                                </View>
                                {h.address && (
                                    <View style={styles.hSubRow}>
                                        <Home size={12} color="#94A3B8" />
                                        <Text style={styles.hSubText} numberOfLines={1}>{h.address}</Text>
                                    </View>
                                )}
                                {h.contactNumber && (
                                    <View style={styles.hSubRow}>
                                        <Phone size={12} color="#94A3B8" />
                                        <Text style={styles.hSubText}>{h.contactNumber}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity onPress={() => openEdit(h)} style={styles.editBtn}>
                                    <Edit2 size={18} color="#2563EB" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => confirmDelete(h.id || h._id, h.name)} style={styles.delBtn}>
                                    <Trash2 size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                {!loading && filteredHospitals.length > visibleCount && (
                    <TouchableOpacity style={styles.loadMoreBtn} onPress={() => setVisibleCount(c => c + PAGE_SIZE)}>
                        <Text style={styles.loadMoreText}>Show More ({filteredHospitals.length - visibleCount} remaining)</Text>
                    </TouchableOpacity>
                )}
                
                {!loading && visibleCount > PAGE_SIZE && (
                    <TouchableOpacity style={styles.loadMoreBtn} onPress={() => setVisibleCount(PAGE_SIZE)}>
                        <Text style={styles.loadMoreText}>Show Less</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <Modal visible={showForm} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.formHeaderRow}>
                            <Building2 size={20} color="#0F766E" />
                            <Text style={styles.formTitle}>{editingId ? 'Edit Medical Center' : 'Add Medical Center'}</Text>
                        </View>
                        
                        <ScrollView>
                            <Text style={styles.label}>Hospital Name</Text>
                            <TextInput style={styles.input} placeholder="E.g., National General" value={name} onChangeText={setName} />

                            <View style={styles.splitRow}>
                                <View style={{flex: 1}}>
                                    <Text style={styles.label}>Province</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={province}
                                            onValueChange={(p) => {
                                                setProvince(p);
                                                const d = getDistrictsByProvince(p)[0] || '';
                                                setDistrict(d);
                                            }}
                                            style={styles.picker}
                                        >
                                            {PROVINCES.map(p => <Picker.Item key={p} label={p} value={p} style={{fontSize: 15}} />)}
                                        </Picker>
                                    </View>
                                </View>
                                <View style={{width: 10}} />
                                <View style={{flex: 1}}>
                                    <Text style={styles.label}>District</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={district}
                                            onValueChange={(d) => setDistrict(d)}
                                            style={styles.picker}
                                        >
                                            {districts.map(d => <Picker.Item key={d} label={d} value={d} style={{fontSize: 15}} />)}
                                        </Picker>
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.label}>Address</Text>
                            <TextInput style={styles.input} placeholder="Full postal address" value={address} onChangeText={setAddress} />

                            <Text style={styles.label}>Contact Number</Text>
                            <TextInput style={styles.input} placeholder="+94 XX XXX XXXX" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={resetForm}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={handleSaveHospital} disabled={adding}>
                                    {adding ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>{editingId ? 'Save Changes' : 'Register Hub'}</Text>}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4FF' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    unauthText: { marginTop: 10, fontSize: 18, fontWeight: 'bold', color: '#1E293B' },

    header: { backgroundColor: '#FFFFFF', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDFA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    refreshText: { color: '#0F766E', fontWeight: 'bold', fontSize: 13 },
    backText: { color: '#64748B', fontWeight: 'bold' },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
    subtitle: { color: '#64748B', fontSize: 13 },

    scroll: { padding: 20 },
    
    addTrigger: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#CCFBF1', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#5EEAD4' },
    addTriggerText: { color: '#0F766E', fontWeight: 'bold', fontSize: 15 },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, marginBottom: 20 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, height: 45, fontSize: 15, color: '#1E293B' },

    listTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 },
    
    hCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    hInfo: { flex: 1 },
    hName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
    hLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    hLocation: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    hSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    hSubText: { fontSize: 12, color: '#94A3B8' },
    
    actions: { flexDirection: 'row', gap: 8 },
    editBtn: { padding: 8, backgroundColor: '#EFF6FF', borderRadius: 8 },
    delBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, maxHeight: '90%' },
    formHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    formTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
    
    label: { fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 15, color: '#1E293B' },
    splitRow: { flexDirection: 'row', marginTop: 4 },
    pickerContainer: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden', justifyContent: 'center', height: 48 },
    picker: { height: 48, width: '100%', color: '#1E293B', marginLeft: -8 },
    
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
    modalBtn: { flex: 1, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    cancelBtn: { backgroundColor: '#F1F5F9' },
    cancelBtnText: { color: '#475569', fontWeight: 'bold' },
    submitBtn: { backgroundColor: '#0F766E' },
    submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

    loadMoreBtn: { padding: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20 },
    loadMoreText: { color: '#64748B', fontWeight: 'bold', fontSize: 14 }
});
