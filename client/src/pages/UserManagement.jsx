import { useEffect, useState } from "react";
import axios from "axios";
import { message } from "antd";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // form modal states
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("posuser");

  // Get token and logged-in user info from localStorage
  const storedData = localStorage.getItem("pos-user")
    ? JSON.parse(localStorage.getItem("pos-user"))
    : null;
  const token = storedData?.token || "";
  const userRole = storedData?.user?.role || "";

  // Fetch users on page load
  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/users/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
        message.error("Failed to load users");
        setLoading(false);
      });
  }, [token]);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setUserID("");
    setPassword("");
    setRole("posuser");
    setEditUser(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setUserID(user.userID);
    setRole(user.role);
    setPassword(""); // password blank by default
    setShowModal(true);
  };

  const submitForm = async () => {
    const payload = {
      firstName,
      lastName,
      userID,
      role,
      ...(password && { password }),
    };

    try {
      const method = editUser ? "put" : "post";
      const url = editUser
        ? `/api/users/users/${editUser._id}`
        : "/api/users/create-user";

      const res = await axios({
        method,
        url,
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser = res.data;

      // Update list on edit or add
      setUsers((prev) => {
        if (editUser) {
          return prev.map((u) => (u._id === editUser._id ? updatedUser : u));
        }
        return [...prev, updatedUser];
      });

      message.success(editUser ? "User updated" : "User added");
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error("Failed to submit user");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await axios.delete(`/api/users/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => u._id !== id));
      message.success("User deleted");
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("Failed to delete user");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>User Management</h2>

      <button onClick={openAddModal} style={styles.addButton}>
        + Add User
      </button>

      {/* User Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>UserID</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>
                {u.firstName} {u.lastName}
              </td>
              <td>{u.userID}</td>
              <td>{u.role}</td>
              <td>
                <button onClick={() => openEditModal(u)} style={styles.editBtn}>
                  Edit
                </button>
                <button
                  onClick={() => deleteUser(u._id)}
                  style={styles.deleteBtn}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>{editUser ? "Edit User" : "Add User"}</h3>

            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={styles.input}
            />

            <input
              type="text"
              placeholder="User ID"
              value={userID}
              onChange={(e) => setUserID(e.target.value)}
              style={styles.input}
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.input}
            >
              {/* Show "superuser" only if logged-in user is superuser */}
              {userRole === "superuser" && (
                <option value="superuser">Superuser</option>
              )}
              <option value="manager">Manager</option>
              <option value="posuser">POS User</option>
            </select>

            <input
              type="password"
              placeholder={editUser ? "New Password (optional)" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />

            <button onClick={submitForm} style={styles.saveBtn}>
              {editUser ? "Save Changes" : "Add User"}
            </button>

            <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },
  addButton: {
    padding: "10px 15px",
    background: "#0066ff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  editBtn: {
    padding: "8px 10px",
    marginRight: "10px",
  },
  deleteBtn: {
    padding: "8px 10px",
    background: "crimson",
    color: "white",
    border: "none",
    borderRadius: "5px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    width: "350px",
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "10px",
    marginTop: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  saveBtn: {
    marginTop: "15px",
    padding: "10px",
    background: "green",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  closeBtn: {
    marginTop: "10px",
    padding: "10px",
    cursor: "pointer",
  },
};
