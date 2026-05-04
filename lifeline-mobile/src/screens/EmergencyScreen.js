import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Megaphone, ArrowLeft, Ambulance, Hospital as HospitalIcon } from 'lucide-react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PROVINCES, getDistrictsByProvince, getDefaultLocationSelection } from '../constants/locationData';
import { Picker } from '@react-native-picker/picker';

export default function EmergencyScreen({ navigation }) {
    const { user, canCreateHospitalRequest, isAdmin } = useAuth();
    const defaults = getDefaultLocationSelection();

    const [hospitals, setHospitals] = useState([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [location, setLocation] = useState({
        province: defaults.province,
        district: defaults.district
    });
    const [request, setRequest] = useState({
        bloodType: 'O+',
        units: '1',
        hospital: '',
        urgency: 'NORMAL',
        reason: ''
    });
    const [status, setStatus] = useState('idle');
    const [responseMeta, setResponseMeta] = useState(null);

    const districts = getDistrictsByProvince(location.province);

    useEffect(() => {
        if (!location.province || !location.district) {
            setHospitals([]);
            setRequest(prev => ({ ...prev, hospital: '' }));
            return;
        }
        setLoadingHospitals(true);
        api.get('/api/hospitals', {
            params: {
                province: location.province,
                district: location.district
            }
        })
            .then(res => {
                const data = res.data || [];
                setHospitals(data);
                setRequest(prev => ({
                    ...prev,
                    hospital: data[0]?.name || ''
                }));
            })
            .catch(err => {
                console.error('Failed to load hospitals', err);
                setHospitals([]);
                setRequest(prev => ({ ...prev, hospital: '' }));
            })
            .finally(() => setLoadingHospitals(false));
    }, [location.province, location.district]);

    const isCriticalUrgency = useMemo(
        () => String(request.urgency || '').toUpperCase() === 'CRITICAL',
        [request.urgency]
    );

    const handleSubmit = async () => {
        if (!request.hospital) {
            Alert.alert('Error', 'Please select a hospital.');
            return;
        }

        setStatus('sending');
        try {
            const res = await api.post('/api/emergency/request', {
                bloodType: request.bloodType,
                units: Number(request.units),
                hospital: request.hospital,
                urgency: request.urgency,
                reason: request.reason,
                hospitalUserId: user?.id
            });
            setResponseMeta(res?.data || null);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
            Alert.alert('Error', 'Failed to submit request. Please try again.');
        }
    };

    if (!canCreateHospitalRequest && !isAdmin) {
        return (
            <View style={styles.centerContainer}>
                <HospitalIcon size={48} color="#DC2626" />
                <Text style={styles.unauthText}>Access Restricted</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{marginTop: 20}}>
                    <Text style={{color: '#2563EB', fontWeight: 'bold'}}>Return to Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (status === 'success') {
        const broadcastTriggered = Boolean(responseMeta?.broadcastTriggered);
        return (
            <View style={styles.container}>
                <View style={styles.successContent}>
                    <View style={styles.successIconBox}>
                        {broadcastTriggered ? <Ambulance size={72} color="#BE123C" /> : <HospitalIcon size={72} color="#BE123C" />}
                    </View>
                    <Text style={styles.successTitle}>
                        {broadcastTriggered ? 'Emergency Broadcast Sent!' : 'Request Submitted'}
                    </Text>
                    <Text style={styles.successMsg}>
                        {responseMeta?.message || (broadcastTriggered
                            ? `All nearby donors with blood type ${request.bloodType} were notified.`
                            : 'This request now appears in Inventory Management as a normal queue item.')}
                    </Text>
                    <TouchableOpacity 
                        style={styles.returnBtn} 
                        onPress={() => navigation.navigate(isAdmin ? 'AdminDashboard' : 'Dashboard')}
                    >
                        <Text style={styles.returnBtnText}>Return to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.navigate(isAdmin ? 'AdminDashboard' : 'Dashboard')}
            >
                <ArrowLeft size={20} color="#64748B" />
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.header}>
                <View style={styles.megaphoneBox}>
                    <Megaphone size={24} color="#BE123C" />
                </View>
                <View>
                    <Text style={styles.kicker}>Hospital Requests</Text>
                    <Text style={styles.title}>Request Blood Units</Text>
                    <Text style={styles.subtitle}>Emergency and normal requests.</Text>
                </View>
            </View>

            <View style={styles.formCard}>
                <View style={styles.row}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Blood Type Needed</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={request.bloodType}
                                onValueChange={itemValue => setRequest({ ...request, bloodType: itemValue })}
                                style={styles.picker}
                            >
                                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(type => (
                                    <Picker.Item key={type} label={type} value={type} />
                                ))}
                            </Picker>
                        </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Units Required</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={request.units}
                            onChangeText={text => setRequest({ ...request, units: text })}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Province</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={location.province}
                                onValueChange={province => {
                                    const nextDistricts = getDistrictsByProvince(province);
                                    setLocation({ province, district: nextDistricts[0] || '' });
                                }}
                                style={styles.picker}
                            >
                                {PROVINCES.map(p => (
                                    <Picker.Item key={p} label={p} value={p} />
                                ))}
                            </Picker>
                        </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>District</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={location.district}
                                onValueChange={district => setLocation(prev => ({ ...prev, district }))}
                                style={styles.picker}
                            >
                                {districts.map(d => (
                                    <Picker.Item key={d} label={d} value={d} />
                                ))}
                            </Picker>
                        </View>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Urgency</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={request.urgency}
                            onValueChange={val => setRequest({ ...request, urgency: val })}
                            style={styles.picker}
                        >
                            <Picker.Item label="Normal" value="NORMAL" />
                            <Picker.Item label="Critical" value="CRITICAL" />
                        </Picker>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Hospital</Text>
                    <View style={styles.pickerContainer}>
                        {loadingHospitals ? (
                            <View style={styles.pickerLoader}>
                                <ActivityIndicator size="small" color="#BE123C" />
                                <Text style={styles.loadingText}>Loading hospitals...</Text>
                            </View>
                        ) : (
                            <Picker
                                selectedValue={request.hospital}
                                onValueChange={val => setRequest({ ...request, hospital: val })}
                                style={styles.picker}
                                enabled={hospitals.length > 0}
                            >
                                {hospitals.length === 0 && <Picker.Item label="No hospitals available" value="" />}
                                {hospitals.map(h => (
                                    <Picker.Item key={h.id} label={`${h.name} (${h.district})`} value={h.name} />
                                ))}
                            </Picker>
                        )}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Reason (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={request.reason}
                        onChangeText={text => setRequest({ ...request, reason: text })}
                        placeholder="Short reason for this request"
                    />
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        {isCriticalUrgency
                            ? 'Critical urgency sends this request to the Emergency Priority Queue and triggers donor broadcast.'
                            : 'Normal urgency sends this request to the normal queue without broadcast.'}
                    </Text>
                </View>

                <TouchableOpacity 
                    style={[styles.submitBtn, status === 'sending' && styles.submitBtnDisabled]} 
                    onPress={handleSubmit}
                    disabled={status === 'sending'}
                >
                    {status === 'sending' ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitBtnText}>
                            {isCriticalUrgency ? 'BROADCAST + SUBMIT' : 'SUBMIT REQUEST'}
                        </Text>
                    )}
                </TouchableOpacity>

                {status === 'error' && (
                    <Text style={styles.errorText}>Failed to submit request. Please try again.</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4FF' },
    scroll: { padding: 20, paddingBottom: 40 },
    backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backText: { marginLeft: 8, color: '#64748B', fontWeight: 'bold' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
    megaphoneBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FECDD3', alignItems: 'center', justifyContent: 'center' },
    kicker: { color: '#BE123C', fontWeight: 'bold', fontSize: 13, marginBottom: 4, textTransform: 'uppercase' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#BE123C', marginBottom: 4 },
    subtitle: { color: '#64748B', fontSize: 14 },

    formCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: '#E11D48', elevation: 2 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    inputGroup: { flex: 1, marginBottom: 12 },
    label: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginBottom: 6 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, fontSize: 15, color: '#1E293B' },
    pickerContainer: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden', minHeight: 50, justifyContent: 'center' },
    picker: { height: 50, width: '100%', color: '#1E293B' },
    pickerLoader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
    loadingText: { color: '#64748B', fontSize: 14 },

    infoBox: { padding: 12, backgroundColor: '#FFF1F2', borderRadius: 8, marginBottom: 20 },
    infoText: { color: '#BE123C', fontSize: 13, fontWeight: '500' },

    submitBtn: { backgroundColor: '#E11D48', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginTop: 10 },

    successContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
    successIconBox: { marginBottom: 24 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#BE123C', textAlign: 'center', marginBottom: 16 },
    successMsg: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 32 },
    returnBtn: { backgroundColor: '#E11D48', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    returnBtnText: { color: '#FFF', fontWeight: 'bold' }
});
