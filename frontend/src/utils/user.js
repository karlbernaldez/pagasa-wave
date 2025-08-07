const getUserData = async () => {
        try {
          // Fetch user details using the user's ID (make sure it's available in localStorage or state)
          const storedUser = JSON.parse(localStorage.getItem("user"));
          const userId = storedUser?.id; // Ensure `userData.id` is available
          if (userId) {
            const data = await fetchUserDetails(userId, isAuthenticated); // Pass the necessary parameters
            setUser(data); // Store the fetched user data
            setPosition(data?.position || ""); // Set position from the fetched data (if available)
            setLoadingUser(false); // Stop loading once the data is fetched
          } else {
            throw new Error("User ID not found");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
          setLoadingUser(false); // Stop loading in case of an error
        }
      };