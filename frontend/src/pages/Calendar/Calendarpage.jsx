import { addDays, format, startOfWeek } from "date-fns";
import { useEffect, useRef, useState } from "react";

import styles from "../../assets/styles/CalendarPage.module.css";
import Modal from "../../components/Modal/Modal";
import MypageNav from "../../components/MypageNavBar/MypageNav";
import FiveDayForecast from "./FiveDayForecast";
import WeatherWidget from "./WeatherWidget";

function CalendarPage2() {
  const token = localStorage.getItem('token');
  
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const [weekStart, setWeekStart] = useState(
    startOfWeek(today, { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const monthLabel = format(new Date(selectedDate), "MMMM yyyy");
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(weekStart, i)
  );

  // === Checklist 상태 === //
  const [checklists, setChecklists] = useState([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [editItemId, setEditItemId] = useState(null);
  const [editItemText, setEditItemText] = useState("");
  const listRef = useRef(null);

  // === Plan 상태 === //
  const [plans, setPlans] = useState([]);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    startTime: "00:00",
    endTime: "01:00",
  });
  const [editPlanId, setEditPlanId] = useState(null);

  // 한 번에 Plan + Checklist 가져오기
  const fetchAll = () => {
    const headers = { Authorization: `Bearer ${token}` };
    const planUrl      = `http://localhost:8080/api/v1/plans?date=${selectedDate}`;
    const checklistUrl = `http://localhost:8080/api/v1/checklists?date=${selectedDate}`;

    Promise.all([
      fetch(planUrl,      { headers }).then(res => res.ok ? res.json() : Promise.reject(res.status)),
      fetch(checklistUrl, { headers }).then(res => res.ok ? res.json() : Promise.reject(res.status)),
    ])
    .then(([planData, checklistData]) => {
      setPlans(planData);
      setChecklists(
        checklistData.map(c => ({
          id:      c.checklistId,
          planId:  c.planId,
          text:    c.itemContent,
          checked: c.isChecked,
        }))
      );
    })

    .catch(err => console.error("fetchAll error:", err));
  };

  useEffect(() => {
    if (!token) return;
    fetchAll();
  }, [selectedDate, token]);

  const toggleChecklist = (id, newChecked) => {
    console.log("toggleChecklist", id, newChecked, selectedDate);
    const item = checklists.find(c => c.id === id);
    fetch(`http://localhost:8080/api/v1/checklists/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        planId:     item.planId,       // null 혹은 숫자
        travelDate: selectedDate,
        itemContent:item.text,
        isChecked:  newChecked,
      }),
    })
    .then(r => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(fetchAll)
    .catch(console.error);
  };

  // Plan CRUD 함수
  const createPlan = () => {
    fetch("http://localhost:8080/api/v1/plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        travelDate: selectedDate,
        title: newPlan.title,
        description: newPlan.description,
        startTime: newPlan.startTime,
        endTime: newPlan.endTime,
      }),
    })
    .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(() => {
      setIsAddingPlan(false);
      setNewPlan({ title: "", description: "", startTime: "09:00", endTime: "10:00" });
      fetchAll();
    })
    .catch(console.error);
  };

  const updatePlan = () => {
    fetch(`http://localhost:8080/api/v1/plans/${editPlanId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        travelDate: selectedDate,
        title: newPlan.title,
        description: newPlan.description,
        startTime: newPlan.startTime,
        endTime: newPlan.endTime,
      }),
    })
    .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(() => {
      setIsAddingPlan(false);
      setEditPlanId(null);
      fetchAll();
    })
    .catch(console.error);
  };

  const deletePlan = planId => {
    fetch(`http://localhost:8080/api/v1/plans/${planId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => { if (!res.ok) throw new Error(res.status); 
      fetchAll(); })
    .catch(console.error);
  };


  // 외부 클릭 시 edit/add 모드 취소 로직
  const onListSectionClick = (e) => {
    // 1) 편집 모드 취소
    if (editItemId !== null) {
      // 체크박스나 버튼 클릭 시 무시
      if (
        (e.target.tagName === "INPUT" && e.target.type === "checkbox") ||
        e.target.closest("button")
      )
        return;
      // 현재 편집 중인 li 내부 클릭 시 무시
      const editingLi = listRef.current.querySelector(
        `[data-id="${editItemId}"]`
      );
      if (editingLi && editingLi.contains(e.target)) return;
      // 그 외 외부 클릭은 편집 취소
      setEditItemId(null);
      return;
    }

    // 2) 추가 모드 취소
    if (isAddingItem) {
      const addForm = listRef.current.querySelector(`.${styles.addForm}`);
      // addForm 내부가 아닐 때만 취소
      if (addForm && !addForm.contains(e.target)) {
        setIsAddingItem(false);
        setNewItemText("");
      }
      return;
    }
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    fetch("http://localhost:8080/api/v1/checklists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        travelDate: selectedDate,
        itemContent: newItemText,
        isChecked: false,
      }),
    })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(() => {
      setNewItemText("");
      setIsAddingItem(false);
      fetchAll();
    })
    .catch(console.error);
  };

  const saveItem = () => {
    if (!editItemText.trim()) { setEditItemId(null); return; }
    fetch(`http://localhost:8080/api/v1/checklists/${editItemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        planId: null,
        travelDate: selectedDate,
        itemContent: editItemText,
        isChecked: false,
      }),
    })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(() => {
      setEditItemId(null);
      fetchAll();
    })
    .catch(console.error);
  };

  const removeItem = (id) => {
    fetch(`http://localhost:8080/api/v1/checklists/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => { if (!r.ok) throw new Error(r.status); fetchAll(); })
    .catch(console.error);
  };

  

  const openAddPlan = (plan = null) => {
    if (plan) {
      setEditPlanId(plan.planId);
      setNewPlan({
        title: plan.title,
        description: plan.description,
        startTime: plan.startTime,
        endTime: plan.endTime,
      });
    } else {
      setEditPlanId(null);
      setNewPlan({ title: "", description: "", startTime: "00:00", endTime: "01:00" });
    }
    setIsAddingPlan(true);
  };
  
  const todaysPlans = plans.filter((p) => p.travelDate === selectedDate);
  

  return (
    <>
      <MypageNav />
      <div className={styles.layout}>
        <div className={styles.container}>
          <div className={styles.contents_wrap}>
            {/* Month Nav */}
            <div className={styles.monthNav}>
              <span className={styles.monthLabel}>{monthLabel}</span>
            </div>

            {/* Week Header */}
            <div className={styles.weekHeader}>
              <button
                className={styles.arrowBtn}
                onClick={() => {
                  const newStart = addDays(weekStart, -7);
                  setWeekStart(newStart);
                  // 주 시작일을 selectedDate로 설정
                  setSelectedDate(format(newStart, "yyyy-MM-dd"));
                }}
              >
                <img src="src/assets/images/left.png" alt="left arrow" />
              </button>
              {weekDays.map((d) => {
                const ds = format(d, "yyyy-MM-dd");
                const isToday = ds === todayStr;
                const isSel = !isToday && ds === selectedDate;
                return (
                  <div
                    key={ds}
                    className={[
                      styles.dayBox,
                      isToday ? styles.todayBox
                              : isSel && styles.selectedBox,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setSelectedDate(ds)}
                  >
                    <div className={styles.dateNum}>
                      {format(d, "d")}
                    </div>
                    <div className={styles.weekDay}>
                      {format(d, "EEE").toUpperCase()}
                    </div>
                  </div>
                );
              })}
              <button
                className={styles.arrowBtn}
                onClick={() =>{
                  const newStart = addDays(weekStart, 7);
                  setWeekStart(newStart);
                  // 주 시작일을 selectedDate로 설정
                  setSelectedDate(format(newStart, "yyyy-MM-dd"));
                }}
              >
                <img src="src/assets/images/right.png" alt="left arrow" />
              </button>
            </div>

            {/* Main Content */}
            <div className={styles.mainBox}>
              {/* Checklist Section */}
              <div
                className={styles.listSection}
                ref={listRef}
                onClick={onListSectionClick}
              >
                <div className={styles.panelHeader}>
                  <button
                    className={styles.addButton}
                    onClick={() => {
                      setIsAddingItem(true);
                      setEditItemId(null);
                    }}
                  >
                    <img
                      src="/src/assets/images/plus.png"
                      alt="추가"
                    />
                  </button>
                </div>

                {/* Add Form */}
                {isAddingItem && (
                  <div className={styles.addForm}>
                    <input
                      type="text"
                      className={styles.addInput}
                      placeholder="새 항목"
                      value={newItemText}
                      onChange={(e) =>
                        setNewItemText(e.target.value)
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && addItem()
                      }
                    />
                    <button
                      onClick={addItem}
                      className={styles.confirmBtn}
                    >
                      ✔
                    </button>
                  </div>
                )}

                {/* Item List */}
                <ul className={styles.listContent}>
                  {checklists.map((it) => (
                    <li
                      key={it.id}
                      data-id={it.id}
                      className={styles.listItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        // 체크박스나 버튼이면 편집 진입 막기
                        if (
                          e.target.tagName === "INPUT" ||
                          e.target.closest("button")
                        )
                          return;
                        setEditItemId(it.id);
                        setEditItemText(it.text);
                        setIsAddingItem(false);
                      }}
                    >
                      {editItemId === it.id ? (
                        <>
                          <input
                            type="text"
                            className={styles.addInput}
                            value={editItemText}
                            onChange={(e) =>
                              setEditItemText(e.target.value)
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && saveItem()
                            }
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveItem();
                            }}
                            className={styles.confirmBtn}
                          >
                            ✔
                          </button>
                        </>
                      ) : (
                        <>
                          <label>
                            <input 
                              type="checkbox"
                              checked={it.checked}
                              onChange={() => toggleChecklist(it.id, !it.checked)} 
                            />
                            <span>{it.text}</span>
                          </label>
                          <div className={styles.listActions}>
                            <button
                              className={styles.deleteItemBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(it.id);
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Plan Section */}
              <section className={styles.planSection}>
                <div className={styles.panelHeader}>
                  <button
                    className={styles.addButton}
                    onClick={() => openAddPlan()}
                  >
                    <img
                      src="/src/assets/images/plus.png"
                      alt="일정 추가"
                    />
                  </button>
                </div>
                <div className={styles.scheduleGrid}>
                  <div className={styles.timeColumn}>
                    {Array.from({ length: 24 }, (_, i) =>
                      (i.toString().padStart(2, "0") + ":00")
                    ).map((h) => (
                      <div key={h} className={styles.timeCell}>
                        {h}
                      </div>
                    ))}
                  </div>
                  <div className={styles.cells} />
                  {todaysPlans.map((p) => {
                    const [sh, sm] = p.startTime.split(":").map(Number);
                    const [eh, em] = p.endTime.split(":").map(Number);
                    // 분단위 그대로 계산
                    const startTotal = sh * 60 + sm;              // ex. 1:30 → 90
                    const duration   = eh * 60 + em - startTotal;  // ex. 2:15 - 1:30 = 45분
                    const rowStart = startTotal + 1;              // grid-row는 1부터
                    const rowSpan  = duration;
                    return (
                      <div
                        key={p.planId}
                        className={styles.planCard}
                        style={{
                          gridColumn: 2,
                          gridRow: `${rowStart} / span ${rowSpan}`,
                          background: p.color,
                        }}
                        onClick={() => openAddPlan(p)}
                      >

                        <h4 className={styles.planTitle}>
                          {p.title}
                        </h4>

                        <div className={styles.planBody}>
                          {p.description && (
                            <p className={styles.planDesc}>
                              {p.description}
                            </p>
                          )}
                          <small className={styles.planTime}>
                            {p.startTime.slice(0,5)} - {p.endTime.slice(0,5)}
                          </small>
                        </div>
                          <button
                            className={styles.deletePlanBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePlan(p.planId);
                            }}
                          >
                            ✕
                          </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Weather & Character */}
              <div className={styles.weatherSection}>
                <WeatherWidget />
                <FiveDayForecast />
                <div className={styles.character}>
                  <img
                    src="src/assets/images/character.png"
                    alt="walking character"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Add/Edit Modal */}
      <Modal
        isOpen={isAddingPlan}
        onClose={() => setIsAddingPlan(false)}
        title={editPlanId ? "일정 수정" : "새 일정 추가"}
        confirmText="저장"
        cancelText="취소"
        onConfirm={editPlanId ? updatePlan : createPlan}
        onCancel={() => setIsAddingPlan(false)}
      >
        <div className={styles.modalContent}>
          <div className={styles.formColumn}>
            <label>제목</label>
            <input
              type="text"
              value={newPlan.title}
              onChange={(e) =>
                setNewPlan((np) => ({
                  ...np,
                  title: e.target.value,
                }))
              }
              placeholder="일정 제목"
            />
          </div>
          <div className={styles.formColumn}>
            <label>시간</label>
            <div className={styles.timeRange}>
              <input
                type="time"
                min="00:00"
                max="23:59"
                step="60"
                value={newPlan.startTime}
                onChange={(e) =>
                  setNewPlan((np) => ({
                    ...np,
                    startTime: e.target.value,
                  }))
                }
              />
              <span className={styles.timeSeparator}>—</span>
              <input
                type="time"
                min="00:00"
                max="23:59"
                step="60"
                value={newPlan.endTime}
                onChange={(e) =>
                  setNewPlan((np) => ({
                    ...np,
                    endTime: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className={styles.formColumn}>
            <label>내용</label>
            <textarea
              rows={3}
              className={styles.planTextarea}
              value={newPlan.description}
              onChange={(e) =>
                setNewPlan((np) => ({
                  ...np,
                  description: e.target.value,
                }))
              }
              placeholder="상세 내용을 입력하세요"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

export default CalendarPage2