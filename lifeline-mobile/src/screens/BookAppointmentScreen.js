import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { XCircle } from 'lucide-react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PROVINCES, getDistrictsByProvince, getDefaultLocationSelection } from '../constants/locationData';
import DonorEligibility from '../components/DonorEligibility';

const HOSPITAL_WORK_START = '08:00';
const HOSPITAL_WORK_END = '17:00';

const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

const getMaxBookingDate = () => {
    const maxDate = getToday();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate;
};

const formatDateKey = (value) => {
    const dateValue = new Date(value);
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateKey = (value) => {
    const [year, month, day] = String(value || '').split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

const isWorkingDay = (value) => {
    const dateValue = typeof value === 'string' ? parseDateKey(value) : value;
    if (!dateValue) return false;
    const day = dateValue.getDay();
    return day !== 0 && day !== 6;
};

const getTodayDate = () => formatDateKey(getToday());
const getMaxBookingDateKey = () => formatDateKey(getMaxBookingDate());
const isDateWithinNext7Days = (dateValue) => dateValue >= getTodayDate() && dateValue <= getMaxBookingDateKey();

export default function BookAppointmentScreen({ navigation }) {
    const { user } = useAuth();
    const currentUserId = user?.id || user?.userId;
    const donorPortalRoute = 'Donors';
    const defaults = getDefaultLocationSelection();

    const [step, setStep] = useState(1);
    const [eligibilityInfo, setEligibilityInfo] = useState({ checking: true, eligible: true });
    const [questionnaireEligible, setQuestionnaireEligible] = useState(null);
    const [questionnaireAnswers, setQuestionnaireAnswers] = useState(null);
    const [camps, setCamps] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loadingCenters, setLoadingCenters] = useState(true);
    const [location, setLocation] = useState({
        province: user?.province || defaults.province,
        district: user?.district || defaults.district
    });
    const [formData, setFormData] = useState({
        centerKey: '',
        date: '',
        time: '',
        bloodType: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [dateValue, setDateValue] = useState(new Date());
    const [timeValue, setTimeValue] = useState(new Date());
    const isSubmittingRef = useRef(false);

    const formatEligibilityMessage = (details = {}) => {
        if (details?.type === 'SAFETY') {
            return details.reason || 'You are not eligible to donate because your latest test result is positive.';
        }

        if (details?.type === 'RECENT_DONATION') {
            const dayText = typeof details.daysRemaining === 'number'
                ? ` Please wait ${details.daysRemaining} more day(s).`
                : '';
            const nextDateText = details.nextEligibleDate
                ? ` Next eligible date: ${new Date(details.nextEligibleDate).toLocaleDateString()}.`
                : '';

            return `${details.reason || 'You donated recently and must wait before booking again.'}${dayText}${nextDateText}`;
        }

        return details.reason || 'You are not eligible to donate right now.';
    };

    useEffect(() => {
        if (!currentUserId) {
            setEligibilityInfo({
                checking: false,
                eligible: false,
                reason: 'Unable to verify account. Please sign in again.'
            });
            return;
        }

        const checkEligibility = async () => {
            try {
                const res = await api.get(`/api/donors/${currentUserId}/eligibility`);
                setEligibilityInfo({
                    checking: false,
                    eligible: Boolean(res.data?.eligible),
                    reason: res.data?.reason,
                    type: res.data?.type,
                    daysRemaining: res.data?.daysRemaining,
                    nextEligibleDate: res.data?.nextEligibleDate
                });
            } catch (err) {
                console.error('Failed to check eligibility', err);
                setEligibilityInfo({ checking: false, eligible: true });
            }
        };

        checkEligibility();
    }, [currentUserId]);

    useEffect(() => {
        const loadCenters = async () => {
            setLoadingCenters(true);
            try {
                // Fetch both camps and hospitals so the booking screen can offer every valid donation center.
                const [campRes, hospitalRes] = await Promise.all([
                    api.get('/api/camps'),
                    api.get('/api/hospitals', {
                        params: {
                            province: location.province,
                            district: location.district
                        }
                    })
                ]);

                setCamps(campRes.data || []);
                setHospitals(hospitalRes.data || []);
            } catch (err) {
                // Catch fetch failures and fall back to empty center lists instead of crashing the form.
                console.error('Failed to load centers', err);
                setCamps([]);
                setHospitals([]);
            } finally {
                setLoadingCenters(false);
            }
        };

        loadCenters();
    }, [location.province, location.district]);

    const centers = useMemo(() => {
        const hospitalList = (hospitals || []).map((hospital) => ({
            id: String(hospital.id),
            label: hospital.name,
            type: 'HOSPITAL',
            province: location.province,
            district: location.district
        }));

        const campCenters = (camps || [])
            .filter((camp) => (camp.campStatus || '').toUpperCase() !== 'ENDED')
            .filter((camp) => isDateWithinNext7Days(String(camp.date || '')))
            .filter((camp) => String(camp.province) === location.province && String(camp.district) === location.district)
            .map((camp) => ({
                id: String(camp.id),
                label: camp.name,
                type: 'CAMP',
                date: camp.date,
                startTime: camp.startTime || camp.time,
                endTime: camp.endTime,
                campStatus: camp.campStatus
            }));

        return [...hospitalList, ...campCenters];
    }, [camps, hospitals, location]);

    useEffect(() => {
        if (centers.length > 0 && !formData.centerKey) {
            setFormData((prev) => ({ ...prev, centerKey: `${centers[0].type}:${centers[0].id}` }));
        } else if (centers.length === 0) {
            setFormData((prev) => ({ ...prev, centerKey: '' }));
        }
    }, [centers, formData.centerKey]);

    const selectedCenter = centers.find((center) => `${center.type}:${center.id}` === formData.centerKey);

    const handleEligibilityComplete = (isEligible, answers) => {
        setQuestionnaireEligible(isEligible);
        setQuestionnaireAnswers({
            hasDiagnosedDiseases: Boolean(answers?.diseases),
            takingMedications: Boolean(answers?.medications),
            recentSurgery: Boolean(answers?.surgery),
            recentTravel: Boolean(answers?.travel)
        });

        if (isEligible) {
            setFormData((prev) => ({ ...prev, bloodType: answers?.bloodType || '' }));
            setStep(2);
        }
    };

    const validateForm = () => {
        // Validation here enforces the extra booking rules that depend on the selected center type.
        if (!currentUserId) throw new Error('Unable to identify your account. Please sign in again.');
        if (!questionnaireEligible) throw new Error('Please complete the health eligibility check before booking.');
        if (!questionnaireAnswers) throw new Error('Please complete the health eligibility questionnaire.');
        if (!formData.bloodType) throw new Error('Please select your blood type in the eligibility check.');
        if (!selectedCenter) throw new Error('Please select a donation center.');
        if (!formData.date || !formData.time) throw new Error('Date and time are required.');

        if (formData.date < getTodayDate()) {
            throw new Error('Please choose a future date for your appointment.');
        }
        if (formData.date > getMaxBookingDateKey()) {
            throw new Error('Appointments can only be booked within the next 7 days.');
        }
        if (selectedCenter?.type === 'CAMP') {
            if (formData.date !== selectedCenter.date) {
                throw new Error(`This camp only accepts bookings on ${selectedCenter.date}.`);
            }
            if (selectedCenter.startTime && formData.time < selectedCenter.startTime) {
                throw new Error(`Booking must be after camp start time ${selectedCenter.startTime}.`);
            }
            if (selectedCenter.endTime && formData.time > selectedCenter.endTime) {
                throw new Error(`Booking must be before camp end time ${selectedCenter.endTime}.`);
            }
        } else {
            if (!isWorkingDay(formData.date)) {
                throw new Error('Hospital appointments can only be booked on working days.');
            }
            if (formData.time < HOSPITAL_WORK_START || formData.time > HOSPITAL_WORK_END) {
                throw new Error(`Hospital bookings are available from ${HOSPITAL_WORK_START} to ${HOSPITAL_WORK_END}.`);
            }
        }
    };

    const handleSubmit = async () => {
        setErrorMsg('');

        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setSubmitting(true);

        try {
            // Validate locally first, then re-check eligibility through the API before booking.
            validateForm();

            const eligibilityResponse = await api.get(`/api/donors/${currentUserId}/eligibility`);
            if (!eligibilityResponse.data?.eligible) {
                throw new Error(formatEligibilityMessage(eligibilityResponse.data));
            }

            const localDateTime = `${formData.date}T${formData.time}`;

            await api.post('/api/appointments/book', {
                donorId: currentUserId,
                donorUserId: currentUserId,
                donorName: user?.name || 'Unknown User',
                hospitalId: String(selectedCenter.id),
                centerType: selectedCenter.type,
                centerName: selectedCenter.label,
                date: localDateTime,
                bloodType: formData.bloodType,
                hasDiagnosedDiseases: questionnaireAnswers.hasDiagnosedDiseases,
                takingMedications: questionnaireAnswers.takingMedications,
                recentSurgery: questionnaireAnswers.recentSurgery,
                recentTravel: questionnaireAnswers.recentTravel
            });

            navigation.navigate(donorPortalRoute);
        } catch (error) {
            // Catch validation and API errors in one place so the screen can show a single friendly message.
            const apiMessage = typeof error?.response?.data === 'string' ? error.response.data : null;
            setErrorMsg(apiMessage || error.message || 'Booking failed. Please try another time.');
        } finally {
            setSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    if (eligibilityInfo.checking) {
        return (
            <View style={[styles.container, styles.flexCenter]}>
                <ActivityIndicator size="large" color="#E11D48" />
                <Text style={styles.loadingText}>Checking eligibility...</Text>
            </View>
        );
    }

    if (!eligibilityInfo.eligible) {
        return (
            <View style={[styles.container, styles.flexCenter]}>
                <View style={styles.restrictedCard}>
                    <XCircle size={64} color="#B91C1C" />
                    <Text style={styles.restrictedTitle}>Booking Restricted</Text>
                    <Text style={styles.restrictedText}>{formatEligibilityMessage(eligibilityInfo)}</Text>

                    {eligibilityInfo.nextEligibleDate ? (
                        <View style={styles.dateBox}>
                            <Text style={styles.dateBoxLabel}>Eligible again on:</Text>
                            <Text style={styles.dateBoxValue}>
                                {new Date(eligibilityInfo.nextEligibleDate).toLocaleDateString()}
                            </Text>
                        </View>
                    ) : null}

                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate(donorPortalRoute)}>
                        <Text style={styles.buttonText}>Return to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <Text style={styles.title}>
                        {step === 1 ? 'Step 1: Health Eligibility Check' : 'Step 2: Schedule Your Donation'}
                    </Text>

                    {errorMsg ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        </View>
                    ) : null}

                    {step === 1 ? (
                        <View>
                            <DonorEligibility onComplete={handleEligibilityComplete} />
                            {questionnaireEligible === false ? (
                                <Text style={styles.ineligibleHint}>
                                    You are currently not eligible based on your questionnaire answers.
                                </Text>
                            ) : null}
                        </View>
                    ) : (
                    <View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Province</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    style={styles.picker}
                                    selectedValue={location.province}
                                    dropdownIconColor="#475569"
                                    mode="dropdown"
                                    onValueChange={(itemValue) => {
                                        const districts = getDistrictsByProvince(itemValue);
                                        setLocation({ province: itemValue, district: districts[0] });
                                        setFormData((prev) => ({ ...prev, centerKey: '' }));
                                    }}
                                >
                                    {PROVINCES.map((province) => (
                                        <Picker.Item key={province} label={province} value={province} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                                <Text style={styles.label}>District</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        style={styles.picker}
                                        selectedValue={location.district}
                                        dropdownIconColor="#475569"
                                        mode="dropdown"
                                        onValueChange={(itemValue) => {
                                            setLocation((prev) => ({ ...prev, district: itemValue }));
                                            setFormData((prev) => ({ ...prev, centerKey: '' }));
                                        }}
                                    >
                                        {getDistrictsByProvince(location.province).map((district) => (
                                            <Picker.Item key={district} label={district} value={district} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Select Center</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        style={styles.picker}
                                        selectedValue={formData.centerKey}
                                        dropdownIconColor="#475569"
                                        mode="dropdown"
                                        onValueChange={(itemValue) => setFormData((prev) => ({ ...prev, centerKey: itemValue }))}
                                        enabled={!loadingCenters && centers.length > 0}
                                    >
                                        {centers.length === 0 ? <Picker.Item label="No centers available in this area" value="" /> : null}
                                        {centers.filter((center) => center.type === 'HOSPITAL').map((center) => (
                                            <Picker.Item
                                                key={`HOSPITAL:${center.id}`}
                                                label={center.label}
                                                value={`HOSPITAL:${center.id}`}
                                            />
                                        ))}
                                        {centers.filter((center) => center.type === 'CAMP').map((center) => (
                                            <Picker.Item
                                                key={`CAMP:${center.id}`}
                                                label={`${center.label} (${center.campStatus || 'UPCOMING'})`}
                                                value={`CAMP:${center.id}`}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            {selectedCenter?.type === 'CAMP' ? (
                                <View style={styles.campInfoBox}>
                                    <Text style={styles.campInfoTitle}>Camp Booking Window</Text>
                                    <Text style={styles.campInfoText}>
                                        {selectedCenter.date} {selectedCenter.startTime || '--:--'} - {selectedCenter.endTime || '--:--'}
                                    </Text>
                                </View>
                            ) : null}

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, styles.halfField]}>
                                    <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                                    <TouchableOpacity 
                                        style={styles.input}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Text style={{color: formData.date ? '#1E293B' : '#94A3B8', fontSize: 15}}>
                                            {formData.date || 'Select a date'}
                                        </Text>
                                    </TouchableOpacity>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={dateValue}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(event, selectedDate) => {
                                                if (Platform.OS === 'android') {
                                                    setShowDatePicker(false);
                                                }
                                                if (selectedDate) {
                                                    const dateString = formatDateKey(selectedDate);
                                                    setFormData((prev) => ({ ...prev, date: dateString }));
                                                    setDateValue(selectedDate);
                                                    if (Platform.OS === 'ios') {
                                                        setShowDatePicker(false);
                                                    }
                                                }
                                            }}
                                            minimumDate={getToday()}
                                            maximumDate={getMaxBookingDate()}
                                        />
                                    )}
                                </View>

                                <View style={[styles.inputGroup, styles.halfFieldLast]}>
                                    <Text style={styles.label}>Time (HH:MM)</Text>
                                    <TouchableOpacity 
                                        style={styles.input}
                                        onPress={() => setShowTimePicker(true)}
                                    >
                                        <Text style={{color: formData.time ? '#1E293B' : '#94A3B8', fontSize: 15}}>
                                            {formData.time || 'Select a time'}
                                        </Text>
                                    </TouchableOpacity>
                                    {showTimePicker && (
                                        <DateTimePicker
                                            value={timeValue}
                                            mode="time"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={(event, selectedTime) => {
                                                if (Platform.OS === 'android') {
                                                    setShowTimePicker(false);
                                                }
                                                if (selectedTime) {
                                                    const timeString = selectedTime.toLocaleTimeString('en-US', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit',
                                                        hour12: false
                                                    });
                                                    setFormData((prev) => ({ ...prev, time: timeString }));
                                                    setTimeValue(selectedTime);
                                                    if (Platform.OS === 'ios') {
                                                        setShowTimePicker(false);
                                                    }
                                                }
                                            }}
                                            is24Hour={true}
                                        />
                                    )}
                                </View>
                            </View>

                            <View style={styles.btnGroup}>
                                <TouchableOpacity
                                    style={[styles.backStepButton, submitting && styles.buttonDisabled]}
                                    onPress={() => setStep(1)}
                                    disabled={submitting}
                                >
                                    <Text style={styles.backStepButtonText}>Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, submitting && styles.buttonDisabled]}
                                    onPress={handleSubmit}
                                    disabled={submitting}
                                >
                                    <Text style={styles.buttonText}>{submitting ? 'Confirming...' : 'Confirm Booking'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4FF' },
    flexCenter: { justifyContent: 'center', alignItems: 'center', padding: 20 },
    scroll: { flexGrow: 1, padding: 20 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 20,
        textAlign: 'center'
    },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        backgroundColor: '#F8FAFC',
        color: '#1E293B'
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        overflow: 'hidden'
    },
    picker: {
        height: 54,
        color: '#1E293B'
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfField: { flex: 1, marginRight: 8 },
    halfFieldLast: { flex: 1 },
    btnGroup: { flexDirection: 'row', gap: 12, marginTop: 10 },
    backStepButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center'
    },
    backStepButtonText: {
        color: '#475569',
        fontWeight: '700',
        fontSize: 16
    },
    button: {
        flex: 1,
        backgroundColor: '#E11D48',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center'
    },
    buttonDisabled: { opacity: 0.75 },
    buttonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E2E8F0' },
    btnOutlineText: { color: '#64748B', fontWeight: '700', fontSize: 16 },
    errorBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, marginBottom: 16 },
    errorText: { color: '#B91C1C', fontSize: 14, textAlign: 'center', lineHeight: 20 },
    ineligibleHint: { marginTop: 12, color: '#B91C1C', textAlign: 'center', fontWeight: '600' },
    loadingText: { marginTop: 12, color: '#64748B', fontWeight: '600' },
    restrictedCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        borderTopWidth: 4,
        borderTopColor: '#EF4444',
        width: '100%',
        maxWidth: 400
    },
    restrictedTitle: { fontSize: 20, fontWeight: '800', color: '#991B1B', marginVertical: 12 },
    restrictedText: { color: '#334155', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
    dateBox: {
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        marginBottom: 24
    },
    dateBoxLabel: { color: '#991B1B', fontSize: 13 },
    dateBoxValue: { fontSize: 18, fontWeight: '800', color: '#991B1B', marginTop: 4 },
    campInfoBox: {
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FED7AA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16
    },
    campInfoTitle: { color: '#9A3412', fontWeight: '700', marginBottom: 4 },
    campInfoText: { color: '#9A3412', fontSize: 13 }
});
