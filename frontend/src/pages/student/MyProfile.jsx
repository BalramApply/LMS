import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiLock, FiSave, FiCamera } from "react-icons/fi";
import { updateProfile, updatePassword } from "../../redux/slices/authSlice";
import PasswordStrengthIndicator from "../../pages/auth/components/PasswordStrengthIndicator";
import { isPasswordValid } from "../../utils/passwordStrength";
import { getInitials, getAvatarColor } from "../../utils/formatters";
import toast from "react-hot-toast";
import styles from "./styles/MyProfile.module.css";

const MyProfile = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("profile");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const getAvatarClass = (name) => {
    const colorClass = getAvatarColor(name);
    // Map Tailwind color classes to CSS module classes
    const colorMap = {
      "bg-primary-500": styles.bgPrimary,
      "bg-secondary-500": styles.bgSecondary,
      "bg-green-500": styles.bgSuccess,
      "bg-yellow-500": styles.bgWarning,
      "bg-red-500": styles.bgDanger,
      "bg-blue-500": styles.bgInfo,
      "bg-purple-500": styles.bgPurple,
      "bg-pink-500": styles.bgPink,
    };
    return colorMap[colorClass] || styles.bgPrimary;
  };

  // 🔹 Handle Avatar Change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // 🔹 Update Profile (Name + Avatar)
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    if (!profileData.name.trim()) {
      return toast.error("Name is required");
    }

    try {
      const formData = new FormData();
      formData.append("name", profileData.name);

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      await dispatch(updateProfile(formData)).unwrap();
    } catch (error) {}
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      return toast.error("Current password is required");
    }

    if (!isPasswordValid(passwordData.newPassword)) {
      return toast.error("New password does not meet requirements");
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      await dispatch(
        updatePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      ).unwrap();

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {}
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.pageTitle}>My Profile</h1>

        <div className={styles.grid}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              {/* Avatar Section */}
              <div className={styles.avatarContainer}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className={styles.avatarImage}
                  />
                ) : (
                  <div
                    className={`${styles.avatarPlaceholder} ${getAvatarClass(user?.name)}`}
                  >
                    {getInitials(user?.name)}
                  </div>
                )}

                <label className={styles.cameraButton}>
                  <FiCamera className={styles.cameraIcon} />
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.hiddenInput}
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>

              <h2 className={styles.userName}>{user?.name}</h2>
              <p className={styles.userRole}>{user?.role}</p>
            </div>

            <div className={styles.tabsCard}>
              <button
                onClick={() => setActiveTab("profile")}
                className={`${styles.tabButton} ${
                  activeTab === "profile" ? styles.tabButtonActive : ""
                }`}
              >
                Profile Info
              </button>

              <button
                onClick={() => setActiveTab("password")}
                className={`${styles.tabButton} ${
                  activeTab === "password" ? styles.tabButtonActive : ""
                }`}
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.mainContent}>
            {activeTab === "profile" && (
              <div className={styles.contentCard}>
                <h2 className={styles.contentTitle}>Profile Information</h2>

                <form onSubmit={handleProfileUpdate} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          name: e.target.value,
                        })
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className={`${styles.input} ${styles.inputDisabled}`}
                    />
                  </div>

                  <div className={styles.buttonContainer}>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={styles.submitButton}
                    >
                      <FiSave className={styles.buttonIcon} />
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "password" && (
              <div className={styles.contentCard}>
                <h2 className={styles.contentTitle}>Change Password</h2>

                <form onSubmit={handlePasswordUpdate} className={styles.form}>
                  <div className={styles.formGroup}>
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <input
                      type="password"
                      placeholder="New Password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className={styles.input}
                    />

                    <PasswordStrengthIndicator
                      password={passwordData.newPassword}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.buttonContainer}>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={styles.submitButton}
                    >
                      <FiLock className={styles.buttonIcon} />
                      {isLoading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
