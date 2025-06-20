import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { 
  User, 
  Shield, 
  Clock, 
  Tag, 
  Music, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  LogOut,
  ChevronRight
} from "lucide-react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const handleLogout = () => {
    logout();
    router.replace("/(auth)");
  };
  
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>
        
        <Pressable 
          style={styles.profileCard}
          onPress={() => router.push("/settings/profile")}
        >
          <Image
            source={{ uri: user?.profileImageUrl }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <ChevronRight size={20} color="#999999" />
        </Pressable>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Shield Settings</Text>
          
          <Pressable 
            style={styles.settingItem}
            onPress={() => router.push("/settings/blacklist")}
          >
            <View style={styles.settingIconContainer}>
              <Music size={20} color="#1DB954" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Blacklist</Text>
              <Text style={styles.settingDescription}>
                Manage artists, genres, and songs to shield
              </Text>
            </View>
            <ChevronRight size={20} color="#999999" />
          </Pressable>
          
          <Pressable 
            style={styles.settingItem}
            onPress={() => router.push("/settings/rules")}
          >
            <View style={styles.settingIconContainer}>
              <Clock size={20} color="#1DB954" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Shielding Rules</Text>
              <Text style={styles.settingDescription}>
                Set up automatic shielding schedules
              </Text>
            </View>
            <ChevronRight size={20} color="#999999" />
          </Pressable>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Tag size={20} color="#1DB954" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Activity Tags</Text>
              <Text style={styles.settingDescription}>
                Create and manage listening activity tags
              </Text>
            </View>
            <ChevronRight size={20} color="#999999" />
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <Pressable 
            style={styles.settingItem}
            onPress={() => router.push("/settings/subscription")}
          >
            <View style={styles.settingIconContainer}>
              <CreditCard size={20} color="#1DB954" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Subscription</Text>
              <Text style={styles.settingDescription}>
                {user?.subscriptionTier === "free" 
                  ? "Free Plan - Upgrade for more features" 
                  : user?.subscriptionTier === "premium" 
                    ? "Premium Plan" 
                    : "Pro Plan"}
              </Text>
            </View>
            <ChevronRight size={20} color="#999999" />
          </Pressable>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Bell size={20} color="#1DB954" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Manage app notifications
              </Text>
            </View>
            <Switch 
              trackColor={{ false: "#DDDDDD", true: "#1DB954" }}
              thumbColor="#FFFFFF"
              value={true}
            />
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <HelpCircle size={20} color="#1DB954" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingDescription}>
                Get help with using StreamShield
              </Text>
            </View>
            <ChevronRight size={20} color="#999999" />
          </View>
        </View>
        
        <Pressable 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>StreamShield v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#191414",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191414",
  },
  profileEmail: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#191414",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: "#191414",
  },
  settingDescription: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  logoutText: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "500",
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: "#999999",
  },
});