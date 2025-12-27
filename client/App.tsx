import React, { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./src/services/firebaseConfig";
import { useAuthStore } from "./src/store/useAuthStore";
import Navigation from "./src/navigation"; // Your navigation container

export default function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // onAuthStateChanged returns an 'unsubscribe' function
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe; // Cleanup the listener on unmount
  }, []);

  return <Navigation />;
}
