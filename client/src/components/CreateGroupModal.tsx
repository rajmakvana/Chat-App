import { useState } from "react";
import type { AllUser } from "../pages/Chat";

interface Props {
  users: AllUser[];
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupName: string, members: string[]) => void;
}

export default function CreateGroupModal({
  users,
  isOpen,
  onClose,
  onCreateGroup,
}: Props) {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim()) {
      alert("Enter group name");
      return;
    }

    if (selectedUsers.length === 0) {
      alert("Select at least one member");
      return;
    }

    onCreateGroup(groupName, selectedUsers);

    setGroupName("");
    setSelectedUsers([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center">

      <div className="bg-gray-700 w-96 rounded-lg shadow-lg">


        <div className="p-4 border-b font-semibold text-lg">
          Create Group
        </div>

        <div className="p-4">

          <input
            type="text"
            placeholder="Group Name"
            className="w-full border p-2 rounded mb-3"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <div className="max-h-60 overflow-y-auto border rounded">

            {users.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => toggleUser(user._id)}
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)}
                  readOnly
                />

                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">
                    {user.email}
                  </div>
                </div>

              </div>
            ))}

          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Create
          </button>

        </div>

      </div>

    </div>
  );
}