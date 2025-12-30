import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, MapPin, Navigation } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { StepHeader, BottomButton } from '../../components/shipment/StepComponents';
import { useShipmentStore } from '../../store/useShipmentStore';
import { searchLocation, getCityCenter, GeoLocation } from '../../services/locationApi';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function MeetingPointScreen() {
  const navigation = useNavigation<any>();
  const { draft, setDraft, totalSteps } = useShipmentStore();
  const webViewRef = useRef<WebView>(null);

  // Location state
  const [address, setAddress] = useState(draft.meetingPointAddress);
  const [lat, setLat] = useState<number | null>(draft.meetingPointLat);
  const [lng, setLng] = useState<number | null>(draft.meetingPointLng);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Map state
  const [mapLoaded, setMapLoaded] = useState(false);
  const [centerLat, setCenterLat] = useState<number>(51.5074); // Default: London
  const [centerLng, setCenterLng] = useState<number>(-0.1278);

  // Load city center on mount
  useEffect(() => {
    loadCityCenter();
  }, []);

  const loadCityCenter = async () => {
    if (draft.originCity && draft.originCountry) {
      const center = await getCityCenter(draft.originCity, draft.originCountry);
      if (center) {
        setCenterLat(center.lat);
        setCenterLng(center.lng);
        // Update map center
        if (webViewRef.current && mapLoaded) {
          webViewRef.current.injectJavaScript(`
            map.setView([${center.lat}, ${center.lng}], 13);
            true;
          `);
        }
      }
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchLocation(
          `${searchQuery}, ${draft.originCity || ''}, ${draft.originCountry || ''}`
        );
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, draft.originCity, draft.originCountry]);

  const handleSelectLocation = (location: GeoLocation) => {
    setAddress(location.displayName);
    setLat(location.lat);
    setLng(location.lng);
    setSearchQuery('');
    setShowResults(false);
    Keyboard.dismiss();

    // Update map marker
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (marker) map.removeLayer(marker);
        marker = L.marker([${location.lat}, ${location.lng}]).addTo(map);
        marker.bindPopup("${location.address.road || 'Meeting Point'}").openPopup();
        map.setView([${location.lat}, ${location.lng}], 15);
        true;
      `);
    }
  };

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected') {
        setLat(data.lat);
        setLng(data.lng);
        setAddress(data.address || `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`);
      } else if (data.type === 'mapLoaded') {
        setMapLoaded(true);
      }
    } catch (error) {
      console.error('Map message error:', error);
    }
  };

  const canProceed = address && lat !== null && lng !== null;

  const handleNext = () => {
    setDraft({
      meetingPointAddress: address,
      meetingPointLat: lat,
      meetingPointLng: lng,
    });
    navigation.navigate('PackageDetails');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.navigate('MainTabs');
  };

  // Leaflet map HTML
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; }
        .leaflet-control-attribution { display: none; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
        var marker = null;
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);
        
        // Notify React Native that map is loaded
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapLoaded' }));
        
        // Handle map clicks
        map.on('click', function(e) {
          var lat = e.latlng.lat;
          var lng = e.latlng.lng;
          
          if (marker) map.removeLayer(marker);
          marker = L.marker([lat, lng]).addTo(map);
          
          // Reverse geocode
          fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng)
            .then(response => response.json())
            .then(data => {
              var address = data.display_name || '';
              marker.bindPopup(address.substring(0, 100) + '...').openPopup();
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                lat: lat,
                lng: lng,
                address: address
              }));
            })
            .catch(err => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelected',
                lat: lat,
                lng: lng,
                address: ''
              }));
            });
        });
        
        ${lat && lng ? `
          marker = L.marker([${lat}, ${lng}]).addTo(map);
          map.setView([${lat}, ${lng}], 15);
        ` : ''}
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StepHeader
        title="Meeting Point"
        currentStep={2}
        totalSteps={totalSteps}
        onClose={handleClose}
        onBack={handleBack}
      />

      <View style={styles.content}>
        <Text style={styles.questionText}>
          Where do you want to meet the traveler?
        </Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
          />
          {(searchQuery.length > 0 || searching) && (
            searching ? (
              <ActivityIndicator size="small" color={colors.textTertiary} />
            ) : (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setShowResults(false);
              }}>
                <X size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleSelectLocation(item)}
                >
                  <MapPin size={18} color={colors.textSecondary} />
                  <Text style={styles.resultText} numberOfLines={2}>
                    {item.displayName}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}

        {/* Selected Location */}
        {address && (
          <View style={styles.selectedLocation}>
            <Navigation size={18} color={colors.textPrimary} />
            <Text style={styles.selectedText} numberOfLines={2}>
              {address}
            </Text>
          </View>
        )}

        {/* Map */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={styles.map}
            onMessage={handleMapMessage}
            scrollEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="large" color={colors.textPrimary} />
                <Text style={styles.mapLoadingText}>Loading map...</Text>
              </View>
            )}
          />
        </View>

        <Text style={styles.hint}>
          Tap on the map or search to select a meeting point
        </Text>
      </View>

      <BottomButton
        label="Next"
        onPress={handleNext}
        disabled={!canProceed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  questionText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  resultsContainer: {
    position: 'absolute',
    top: 120,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 200,
    zIndex: 20,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  selectedText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  mapContainer: {
    flex: 1,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  mapLoadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  hint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});
