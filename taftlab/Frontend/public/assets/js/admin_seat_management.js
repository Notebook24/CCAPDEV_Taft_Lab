// Seat selection logic shared by seat selection and confirmation pages.
// No Logic for the confirming the seats yet
(() => {
    const seatGrid = document.getElementById("seatGrid");
    if (!seatGrid) {
        return;
    }

    const selectedCount = document.getElementById("selectedCount");
    const clearBtn = document.getElementById("clearBtn");
    const notice = document.getElementById("notice");
    const anonymousToggle = document.getElementById("anonymousToggle");

    const seatLayout = [
        ["A1", "A2", null, "A3", "A4"],
        ["B1", "B2", null, "B3", "B4"],
        [null, null, null, null, null],
        ["C1", "C2", null, "C3", "C4"],
        ["D1", "D2", null, "D3", "D4"],
    ];

    const seatData = {
        A1: { status: "available" },
        A2: { status: "taken", name: "Kien Ong" },
        A3: { status: "available" },
        A4: { status: "available" },
        B1: { status: "available" },
        B2: { status: "taken", name: "Alain Marcos" },
        B3: { status: "available" },
        B4: { status: "available" },
        C1: { status: "available" },
        C2: { status: "available" },
        C3: { status: "taken", name: "Bien Miranda" },
        C4: { status: "available" },
        D1: { status: "available" },
        D2: { status: "available" },
        D3: { status: "available" },
        D4: { status: "taken", name: "Ivan Florendo" },
    };

    const selectedSeats = new Set();
    const profilePage = "user_profile_view.html";

    function isAnonymousName(name) {
        return !name || name.trim().toLowerCase() === "anonymous";
    }

    function renderSeats() {
        seatGrid.innerHTML = "";
        const columnCount = Math.max(...seatLayout.map((row) => row.length));
        seatGrid.style.gridTemplateColumns = `repeat(${columnCount}, minmax(70px, 1fr))`;

        seatLayout.forEach((row) => {
            row.forEach((seatId) => {
                if (!seatId) {
                    const spacer = document.createElement("div");
                    spacer.className = "seat space";
                    spacer.setAttribute("aria-hidden", "true");
                    seatGrid.appendChild(spacer);
                    return;
                }

                const seat = seatData[seatId] || { status: "available" };
                const button = document.createElement("button");
                button.type = "button";
                button.className = `seat ${seat.status}`;
                button.dataset.seatId = seatId;

                const label = document.createElement("div");
                label.textContent = seatId;
                button.appendChild(label);

                if (seat.status === "taken") {
                    const name = document.createElement("span");
                    name.className = "seat-name";
                    name.textContent = seat.name || "Anonymous";
                    button.appendChild(name);

                    button.onclick = (e) => {
                        const existing = document.getElementById("seatPopup");
                        if (existing) {
                            existing.remove();
                        }
                        const popup = document.createElement("div");
                        popup.id = "seatPopup";
                        popup.textContent = ``;
                        popup.style.position = "absolute";
                        popup.style.background = "#e7f3ec";
                        popup.style.border = "3px solid #ddd";
                        popup.style.color = "#fff";
                        popup.style.borderRadius = "6px";
                        popup.style.fontSize = "14px";
                        popup.style.zIndex = "1000";
                        popup.style.padding = "5px";
                        popup.style.textAlign = "center";

                        const arrow = document.createElement("div");
                        arrow.style.position = "absolute";
                        arrow.style.top = "65px";
                        arrow.style.left = "-20px";
                        arrow.style.width = "0";
                        arrow.style.height = "0";
                        arrow.style.borderTop = "12px solid transparent";
                        arrow.style.borderBottom = "12px solid transparent";
                        arrow.style.borderRight = "20px solid #ddd";

                        popup.appendChild(arrow);

                        const label = document.createElement("h3");
                        label.textContent = "RESERVED";
                        label.style.color = "#dd5c36";

                        popup.appendChild(label);
                        const viewReservationDetailsBtn = document.createElement("button");
                        viewReservationDetailsBtn.textContent = "View Details";
                        viewReservationDetailsBtn.classList.add("unavailable_seat_manage_option_btn");

                        const editReservationDetailsBtn = document.createElement("button");
                        editReservationDetailsBtn.textContent = "Edit Reservation";
                        editReservationDetailsBtn.classList.add("unavailable_seat_manage_option_btn");

                        const deleteReservationBtn = document.createElement("button");
                        deleteReservationBtn.textContent = "Remove Reservation";
                        deleteReservationBtn.classList.add("unavailable_seat_manage_option_btn");
                        deleteReservationBtn.classList.add("unavailable_seat_manage_option_delete_btn");
                        
                        popup.appendChild(viewReservationDetailsBtn);
                        popup.appendChild(editReservationDetailsBtn);
                        popup.appendChild(deleteReservationBtn);

                        const rect = button.getBoundingClientRect();
                        popup.style.top = `${rect.top + window.scrollY - 55}px`;
                        popup.style.left = `${rect.right + window.scrollX - 55}px`;

                        document.body.appendChild(popup);

                        viewReservationDetailsBtn.onclick = () => {
                            showViewModal(seatId, seat.name || "Anonymous");
                        };

                        editReservationDetailsBtn.onclick = () => {
                            showEditModal(seatId, seat.name || "Anonymous");
                        };

                        deleteReservationBtn.onclick = () => {
                            showRemoveModal(seatId, seat.name || "Anonymous");
                        };
                    };
                }

                if (seat.status === "available") {
                    button.onclick = (e) => {
                        const existing = document.getElementById("seatPopup");
                        if (existing) {
                            existing.remove();
                        }
                        const popup = document.createElement("div");
                        popup.id = "seatPopup";
                        popup.textContent = ``;
                        popup.style.position = "absolute";
                        popup.style.background = "#e7f3ec";
                        popup.style.border = "3px solid #ddd";
                        popup.style.color = "#fff";
                        popup.style.borderRadius = "6px";
                        popup.style.fontSize = "14px";
                        popup.style.zIndex = "1000";
                        popup.style.padding = "5px";
                        popup.style.textAlign = "center";

                        const arrow = document.createElement("div");
                        arrow.style.position = "absolute";
                        arrow.style.top = "65px";
                        arrow.style.left = "-20px";
                        arrow.style.width = "0";
                        arrow.style.height = "0";
                        arrow.style.borderTop = "12px solid transparent";
                        arrow.style.borderBottom = "12px solid transparent";
                        arrow.style.borderRight = "20px solid #ddd";

                        popup.appendChild(arrow);

                        const label = document.createElement("h3");
                        label.textContent = "AVAILABLE";
                        label.style.color = "green";

                        popup.appendChild(label);

                        const reserveStudentBtn = document.createElement("button");
                        reserveStudentBtn.textContent = "Reserve Student";
                        reserveStudentBtn.classList.add("available_seat_manage_option_btn");

                        const blockReservationsBtn = document.createElement("button");
                        blockReservationsBtn.textContent = "Block Reservations";
                        blockReservationsBtn.classList.add("available_seat_manage_option_btn");
                        blockReservationsBtn.classList.add("available_seat_manage_option_block_btn");
                        
                        popup.appendChild(reserveStudentBtn);
                        popup.appendChild(blockReservationsBtn);

                        const rect = button.getBoundingClientRect();
                        popup.style.top = `${rect.top + window.scrollY - 55}px`;
                        popup.style.left = `${rect.right + window.scrollX - 55}px`;

                        document.body.appendChild(popup);

                        blockReservationsBtn.onclick = () => {
                            showBlockModal(seatId);
                        };

                        reserveStudentBtn.onclick = () => {
                            showReserveModal(seatId);
                        };
                    };
                }

                seatGrid.appendChild(button);
            });
        });

        updateSummary();
    }

    function toggleSeat(id) {
        if (notice) {
            notice.textContent = "";
        }

        if (selectedSeats.has(id)) {
            selectedSeats.delete(id);
        } else {
            selectedSeats.add(id);
        }

        updateSeatStyles();
        updateSummary();
    }

    function updateSeatStyles() {
        document.querySelectorAll(".seat.available").forEach((seatEl) => {
            const id = seatEl.dataset.seatId;
            seatEl.classList.toggle("selected", selectedSeats.has(id));
        });
    }

    function updateSummary() {
        if (selectedCount) {
            selectedCount.textContent = String(selectedSeats.size);
        }

        return;
    }

    function clearSelection() {
        selectedSeats.clear();
        updateSeatStyles();
        updateSummary();
        if (notice) {
            notice.textContent = "";
        }
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", clearSelection);
    }

    renderSeats();
})();

document.addEventListener("click", function (e) {
    const popup = document.getElementById("seatPopup");
    if (!popup) return;

    if (!popup.contains(e.target) && !e.target.closest(".seat")) {
        popup.remove();
    }
});

document.addEventListener("click", function (e) {
    if (blockModal.style.display === "flex" && e.target === blockModal) {
        blockModal.style.display = "none";
    }

    if (removeModal.style.display === "flex" && e.target === removeModal) {
        removeModal.style.display = "none";
    }

    if (viewModal.style.display === "flex" && e.target === viewModal) {
        viewModal.style.display = "none";
    }

    if (editModal.style.display === "flex" && e.target === editModal) {
        editModal.style.display = "none";
    }

    const reserveModal = document.querySelector(".reserve-student");
    if (reserveModal.style.display === "flex" && e.target === reserveModal) {
        reserveModal.style.display = "none";
    }
});



const blockModal = document.querySelector(".block-reservations");
const removeModal = document.querySelector(".remove-reservation");

// Block Reservations
function showBlockModal(seatId) {
    document.getElementById("blockSeatNumber").value = seatId;

    blockModal.style.display = "flex";

    document.getElementById("cancelBlock").onclick = () => {
        blockModal.style.display = "none";
    };

    document.getElementById("confirmBlock").onclick = () => {
        blockModal.style.display = "none";
    };
}

// Remove Reservations
function showRemoveModal(seatId, name) {
    removeModal.innerHTML = `
        <div class="modal-card-remove-reservation">
            <h3>Are you sure to Remove the Reservation of ${name} for Seat ${seatId}?</h3>
            <div class="modal-actions">
                <button class="modal-btn danger" id="confirmRemove">Remove</button>
                <button class="modal-btn cancel" id="cancelRemove">Cancel</button>
            </div>
        </div>
    `;

    removeModal.style.display = "flex";

    document.getElementById("cancelRemove").onclick = () => {
        removeModal.style.display = "none";
    };

    document.getElementById("confirmRemove").onclick = () => {
        removeModal.style.display = "none";
    };
}

const viewModal = document.querySelector(".view-details");
const editModal = document.querySelector(".edit-reservation");

// View details
function showViewModal(seatId, name) {
    document.getElementById("viewName").textContent = name;
    document.getElementById("viewEmail").textContent = name.toLowerCase().replace(" ", ".") + "@gmail.com";
    document.getElementById("viewSeat").textContent = seatId;

    viewModal.style.display = "flex";

    document.getElementById("closeViewModal").onclick = () => {
        viewModal.style.display = "none";
    };

    document.getElementById("viewProfileBtn").onclick = () => {
        window.location.href = profilePage;
    };
}

// Edit Reservations
function showEditModal(seatId, name) {
    document.getElementById("editName").value = name;
    document.getElementById("editEmail").value = name.toLowerCase().replace(" ", ".") + "@gmail.com";
    document.getElementById("editSeat").value = seatId;

    editModal.style.display = "flex";

    document.getElementById("cancelEditBtn").onclick = () => {
        editModal.style.display = "none";
    };

    document.getElementById("confirmEditBtn").onclick = () => {
        editModal.style.display = "none";
    };
}

// Reserve Walk-in Students
function showReserveModal(seatId) {
    const reserveModal = document.querySelector(".reserve-student");

    document.getElementById("reserveSeatNumber").value = seatId;
    document.getElementById("reserveName").value = "";
    document.getElementById("reserveEmail").value = "";

    reserveModal.style.display = "flex";

    document.getElementById("cancelReserveBtn").onclick = () => {
        reserveModal.style.display = "none";
    };

    document.getElementById("confirmReserveBtn").onclick = () => {
        reserveModal.style.display = "none";
    };
}



