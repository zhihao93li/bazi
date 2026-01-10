"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

/**
 * Page transition animation variants
 * Implements staggered fade-in-up effect per Requirement 12.1
 * - Duration: 0.5s
 * - Stagger delay: 0.1s per item
 */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageTransition - Wrapper component for page-level entrance animations
 * Provides staggered fade-in-up effect for child elements
 */
export function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

/**
 * StaggerItem - Individual item within PageTransition
 * Each item animates with the staggered delay
 */
export function StaggerItem({ children, className = "" }: StaggerItemProps) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * FadeInUp - Simple fade-in-up animation for single elements
 * Can be used independently without PageTransition
 */
interface FadeInUpProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FadeInUp({ 
  children, 
  className = "", 
  delay = 0, 
  duration = 0.5 
}: FadeInUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
