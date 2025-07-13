import React, { useState, useLayoutEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeStore } from "@/stores/theme";
import { useColorScheme } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { themes } from "@/constants/colors";

export default function ActivityTagsScreen() {
  const [tags, setTags] = useState([
    { id: "1", name: "Workout", color: "#FF6B6B", isActive: true },
    { id: "2", name: "Commute", color: "#4ECDC4", isActive: true },
    { id: "3", name: "Study", color: "#45B7D1", isActive: false },
    { id: "4", name: "Party", color: "#96CEB4", isActive: true },
    { id: "5", name: "Sleep", color: "#FFEAA7", isActive: false },
  ]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#FF6B6B");
  const [showAddForm, setShowAddForm] = useState(false);

  const colorScheme = useColorScheme();
  const { theme: themePref, colorTheme } = useThemeStore();
  const effectiveTheme =
    themePref === "auto" ? (colorScheme ?? "light") : themePref;
  const theme = themes[colorTheme][effectiveTheme];

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.background },
      headerTitleStyle: { color: theme.text },
      headerTintColor: theme.text,
    });
  }, [navigation, theme]);

  const handleAddTag = useCallback(() => {
    if (!newTagName.trim()) return;
    if (tags.some((tag) => tag.name === newTagName.trim())) {
      Alert.alert("Duplicate Tag", "This tag already exists.");
      return;
    }
    setTags([
      ...tags,
      {
        id: (tags.length + 1).toString(),
        name: newTagName.trim(),
        color: newTagColor,
        isActive: true,
      },
    ]);
    setNewTagName("");
    setNewTagColor("#FF6B6B");
    setShowAddForm(false);
  }, [newTagName, newTagColor, tags]);

  const handleDeleteTag = useCallback((id: string) => {
    Alert.alert("Delete Tag", "Are you sure you want to delete this tag?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setTags(tags.filter((tag) => tag.id !== id));
        },
      },
    ]);
  }, [tags]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["bottom"]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Activity Tags</Text>
        <View style={styles.addRow}>
          {showAddForm ? (
            <>
              <TextInput
                style={{
                  flex: 1,
                  height: 44,
                  borderColor: theme.tint,
                  borderWidth: 2,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  marginRight: 8,
                  fontSize: 17,
                  color: theme.text,
                  backgroundColor: theme.card || "#23272f",
                  fontWeight: "500",
                }}
                placeholder="Tag Name"
                placeholderTextColor={theme.tint}
                value={newTagName}
                onChangeText={setNewTagName}
                onSubmitEditing={handleAddTag}
              />
              <TextInput
                style={{
                  flex: 1,
                  height: 44,
                  borderColor: theme.tint,
                  borderWidth: 2,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  marginRight: 8,
                  fontSize: 17,
                  color: theme.text,
                  backgroundColor: theme.card || "#23272f",
                  fontWeight: "500",
                }}
                placeholder="Tag Color"
                placeholderTextColor={theme.tint}
                value={newTagColor}
                onChangeText={setNewTagColor}
                onSubmitEditing={handleAddTag}
              />
              <Pressable
                style={[styles.addButton, { backgroundColor: theme.tint }]}
                onPress={handleAddTag}
              >
                <Text
                  style={[styles.addButtonText, { color: theme.background }]}
                >
                  Add
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[styles.addButton, { backgroundColor: theme.tint }]}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={[styles.addButtonText, { color: theme.background }]}>
                Add New Tag
              </Text>
            </Pressable>
          )}
        </View>
        <FlatList
          data={tags}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.tagRow}>
              <View
                style={[styles.tagColor, { backgroundColor: item.color }]}
              />
              <Text style={[styles.tagText, { color: theme.text }]}>
                {item.name}
              </Text>
              <Pressable
                style={[styles.editButton, { backgroundColor: theme.border }]}
              >
                <Text style={[styles.editButtonText, { color: theme.tint }]}>
                  Edit
                </Text>
              </Pressable>
              <Pressable
                style={[styles.deleteButton, { backgroundColor: "#FF3B30" }]}
                onPress={() => handleDeleteTag(item.id)}
              >
                <Text
                  style={[styles.deleteButtonText, { color: theme.background }]}
                >
                  Delete
                </Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.text }]}>
              No tags yet.
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 8,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tagColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  tagText: {
    fontSize: 16,
    flex: 1,
  },
  editButton: {
    marginLeft: 8,
    backgroundColor: "#F5F5F5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#1DB954",
    fontWeight: "bold",
  },
  deleteButton: {
    marginLeft: 8,
    backgroundColor: "#FF3B30",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 32,
    fontSize: 16,
  },
});
