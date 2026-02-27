import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiChevronDown, FiRadio } from 'react-icons/fi';
import api from '../../api/client';
import LiveStudentsMonitor from './LiveStudentsMonitor';
import styles from './styles/ActiveStudentsPage.module.css';

const VALID_ID = /^[a-f\d]{24}$/i;

const ActiveStudentsPage = () => {
  const { courseId: paramCourseId } = useParams();
  const navigate = useNavigate();

  const [courses,          setCourses]          = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loadingCourses,   setLoadingCourses]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res  = await api.get('/courses?limit=100');
        const list = res.data?.data?.courses || res.data?.data || [];
        setCourses(list);

        // Priority: valid URL param → first course in list
        if (paramCourseId && VALID_ID.test(paramCourseId)) {
          setSelectedCourseId(paramCourseId);
        } else if (list.length > 0) {
          const firstId = list[0]._id;
          setSelectedCourseId(firstId);
          // Replace the URL so it shows a real ID
          navigate(`/admin/active-students/${firstId}`, { replace: true });
        }
      } catch {
        // silent
      } finally {
        setLoadingCourses(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  const handleCourseChange = (e) => {
    const id = e.target.value;
    setSelectedCourseId(id);
    navigate(`/admin/active-students/${id}`, { replace: true });
  };

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <FiRadio className={styles.pageHeaderIcon} />
          <div>
            <h1 className={styles.pageTitle}>LIVE_ACTIVITY</h1>
            <p className={styles.pageSubtitle}>{"// REAL-TIME STUDENT MONITORING"}</p>
          </div>
        </div>

        {/* Course selector */}
        <div className={styles.selectorWrap}>
          <label className={styles.selectorLabel}>SELECT_COURSE</label>
          <div className={styles.selectOuter}>
            <select
              value={selectedCourseId}
              onChange={handleCourseChange}
              className={styles.select}
              disabled={loadingCourses}
            >
              {loadingCourses ? (
                <option value="">LOADING...</option>
              ) : courses.length === 0 ? (
                <option value="">NO COURSES FOUND</option>
              ) : (
                courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))
              )}
            </select>
            <FiChevronDown className={styles.selectArrow} />
          </div>
        </div>
      </div>

      {/* Monitor — only renders once we have a validated ID */}
      <LiveStudentsMonitor courseId={selectedCourseId} />
    </div>
  );
};

export default ActiveStudentsPage;