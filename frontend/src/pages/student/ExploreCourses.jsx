import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { getAllCourses, setFilters, clearFilters } from '../../redux/slices/courseSlice';
import CourseCard from '../../pages/student/components/CourseCard';
import { SkeletonCard } from '../../components/common/Loader';
import styles from './styles/ExploreCourses.module.css';

const ExploreCourses = () => {
  const dispatch = useDispatch();
  const { courses, isLoading, filters } = useSelector((state) => state.courses);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  useEffect(() => {
    dispatch(getAllCourses(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: localSearch }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setLocalSearch('');
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value && value !== 'newest'
  ).length;

  const categories = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'AI',
    'Cloud Computing',
    'Cybersecurity',
    'DevOps',
    'Blockchain',
    'Game Development',
    'UI/UX Design',
    'Digital Marketing',
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const courseTypes = ['Free', 'Paid'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <h1 className={styles.title}>Explore Courses</h1>
          <p className={styles.subtitle}>
            Discover courses to boost your skills and advance your career
          </p>
        </motion.div>

        {/* Search and Filter Bar */}
        <div className={styles.filterCard}>
          <div className={styles.filterBar}>
            
            {/* Search */}
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <div className={styles.searchWrapper}>
                <FiSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </form>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={styles.filterToggle}
            >
              <FiFilter />
              Filters
              {activeFiltersCount > 0 && (
                <span className={styles.filterBadge}>
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className={styles.sortSelect}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={styles.filtersPanel}
            >
              <div className={styles.filtersGrid}>
                
                {/* Category Filter */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level Filter */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Level</label>
                  <select
                    value={filters.level}
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="">All Levels</option>
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course Type Filter */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Price</label>
                  <select
                    value={filters.courseType}
                    onChange={(e) => handleFilterChange('courseType', e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="">All Courses</option>
                    {courseTypes.map((type) => (
                      <option key={type} value={type}>
                        {type} Courses
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <div className={styles.clearFiltersWrapper}>
                  <button
                    onClick={handleClearFilters}
                    className={styles.clearFiltersBtn}
                  >
                    <FiX />
                    Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className={styles.activeFilters}>
            {filters.category && (
              <span className={styles.filterTag}>
                Category: {filters.category}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className={styles.filterTagClose}
                >
                  <FiX />
                </button>
              </span>
            )}
            {filters.level && (
              <span className={styles.filterTag}>
                Level: {filters.level}
                <button
                  onClick={() => handleFilterChange('level', '')}
                  className={styles.filterTagClose}
                >
                  <FiX />
                </button>
              </span>
            )}
            {filters.courseType && (
              <span className={styles.filterTag}>
                Type: {filters.courseType}
                <button
                  onClick={() => handleFilterChange('courseType', '')}
                  className={styles.filterTagClose}
                >
                  <FiX />
                </button>
              </span>
            )}
            {filters.search && (
              <span className={styles.filterTag}>
                Search: "{filters.search}"
                <button
                  onClick={() => {
                    handleFilterChange('search', '');
                    setLocalSearch('');
                  }}
                  className={styles.filterTagClose}
                >
                  <FiX />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className={styles.resultsCount}>
          <p className={styles.resultsText}>
            {isLoading ? (
              'Loading courses...'
            ) : (
              <>
                Showing <span className={styles.countHighlight}>{courses.length}</span>{' '}
                {courses.length === 1 ? 'course' : 'courses'}
              </>
            )}
          </p>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className={styles.coursesGrid}>
            {[...Array(6)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className={styles.coursesGrid}>
            {courses.map((course, index) => (
              <CourseCard key={course._id} course={course} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.emptyState}
          >
            <div className={styles.emptyContent}>
              <div className={styles.emptyIcon}>
                <FiSearch />
              </div>
              <h3 className={styles.emptyTitle}>No courses found</h3>
              <p className={styles.emptyText}>
                We couldn't find any courses matching your criteria. Try adjusting
                your filters or search terms.
              </p>
              <button onClick={handleClearFilters} className={styles.emptyClearBtn}>
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}

        {/* Load More (Pagination Placeholder) */}
        {courses.length > 0 && courses.length % 9 === 0 && (
          <div className={styles.loadMoreWrapper}>
            <button className={styles.loadMoreBtn}>Load More Courses</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreCourses;