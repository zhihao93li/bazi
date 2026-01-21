/**
 * SoulSongPage - 灵魂歌曲解锁页面
 *
 * 展示 AI 推荐的三首与用户灵魂共振的歌曲
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Sparkle, Coins, MusicNotes } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useToast, LoadingOverlay } from '../components/common';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import Card from '../components/common/Card';
import { useSubjectDetail } from '../hooks';
import { getSoulSong, unlockSoulSong } from '../services/api';
import styles from './SoulSongPage.module.css';

// 灵魂歌曲价格
const SOUL_SONG_PRICE = 100;

// 轮询间隔（毫秒）
const POLL_INTERVAL = 2000;

export default function SoulSongPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isLoggedIn, updateUser } = useAuth();
    const toast = useToast();

    const subjectId = searchParams.get('subjectId');

    // 状态
    const [isLoading, setIsLoading] = useState(true);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [soulSongData, setSoulSongData] = useState(null);
    const [isUnlocked, setIsUnlocked] = useState(false);

    // 轮询相关
    const pollingRef = useRef(null);
    const isPollingRef = useRef(false);

    // 获取命盘详情
    const { data: currentSubject, isLoading: isLoadingSubject } = useSubjectDetail(subjectId, null, {});

    // 页面加载时滚动到顶部
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // 重定向检查
    useEffect(() => {
        if (!subjectId) {
            navigate('/bazi', { replace: true });
        }
    }, [subjectId, navigate]);

    // 清理轮询
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, []);

    // 获取灵魂歌曲数据
    const fetchSoulSongData = useCallback(async () => {
        if (!subjectId || !isLoggedIn) {
            return null;
        }

        try {
            const response = await getSoulSong(subjectId);
            if (response.success) {
                return response;
            }
        } catch (error) {
            console.error('Failed to fetch soul song:', error);
        }
        return null;
    }, [subjectId, isLoggedIn]);

    // 初始加载
    useEffect(() => {
        if (!subjectId || !isLoggedIn) {
            setIsLoading(false);
            return;
        }

        const init = async () => {
            const response = await fetchSoulSongData();
            if (response) {
                setIsUnlocked(response.isUnlocked);
                setSoulSongData(response.data);
            }
            setIsLoading(false);
        };

        init();
    }, [subjectId, isLoggedIn, fetchSoulSongData]);

    // 开始轮询
    const startPolling = useCallback(() => {
        if (isPollingRef.current) return;

        isPollingRef.current = true;
        setIsUnlocking(true);

        pollingRef.current = setInterval(async () => {
            const response = await fetchSoulSongData();

            if (response && response.isUnlocked && response.data) {
                // 数据已生成完成
                clearInterval(pollingRef.current);
                pollingRef.current = null;
                isPollingRef.current = false;

                setIsUnlocked(true);
                setSoulSongData(response.data);
                setIsUnlocking(false);
                toast.success('灵魂歌曲解锁成功');
            }
        }, POLL_INTERVAL);
    }, [fetchSoulSongData, toast]);

    // 处理解锁
    const handleUnlock = useCallback(async () => {
        if (!isLoggedIn) {
            toast.info('请先登录');
            navigate('/login?callbackUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
            return;
        }

        setIsUnlocking(true);
        try {
            const response = await unlockSoulSong(subjectId);
            if (response.success) {
                // 更新用户积分
                if (response.remainingBalance !== undefined) {
                    updateUser({ points: response.remainingBalance });
                }

                // 如果已经有数据（alreadyUnlocked 或立即返回）
                if (response.data) {
                    setIsUnlocked(true);
                    setSoulSongData(response.data);
                    setIsUnlocking(false);
                    if (!response.alreadyUnlocked) {
                        toast.success('灵魂歌曲解锁成功');
                    }
                } else {
                    // 数据还在生成中，开始轮询
                    startPolling();
                }
            } else {
                setIsUnlocking(false);
                if (response.code === 'INSUFFICIENT_POINTS') {
                    sessionStorage.setItem('insufficientPointsMessage', '积分不足，请先充值');
                    const currentPath = window.location.pathname + window.location.search;
                    sessionStorage.setItem('paymentReturnUrl', currentPath);
                    navigate('/points');
                } else {
                    toast.error(response.message || '解锁失败');
                }
            }
        } catch (error) {
            console.error('Unlock error:', error);
            toast.error('解锁失败，请稍后重试');
            setIsUnlocking(false);
        }
    }, [isLoggedIn, subjectId, navigate, toast, updateUser, startPolling]);

    // 加载中
    if (isLoading || isLoadingSubject) {
        return <LoadingOverlay fixed text="加载中..." />;
    }

    const subjectName = currentSubject?.name || '命盘';

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <GradientBackground
                    gridCount={0}
                    glowColors={[
                        'rgba(138, 67, 225, 0.4)',
                        'rgba(94, 106, 210, 0.4)',
                        'rgba(239, 123, 22, 0.3)',
                    ]}
                    noiseOpacity={0.12}
                    showTopGradient={true}
                    animated
                />

                <div className={styles.container}>
                    {/* 页头 */}
                    <div className={styles.header}>
                        <Link to={`/bazi?subjectId=${subjectId}`} className={styles.backButton}>
                            <ArrowLeft size={20} />
                            <span>返回命盘</span>
                        </Link>
                        <h1 className={styles.title}>
                            <MusicNotes size={28} weight="duotone" />
                            {subjectName}的灵魂歌曲
                        </h1>
                    </div>

                    {/* 内容区域 */}
                    {isUnlocking ? (
                        <Card className={styles.contentCard}>
                            <div className={styles.loading}>
                                <div className={styles.spinner} />
                                <span>正在为你寻找灵魂共振的歌曲...</span>
                                <span className={styles.loadingHint}>通常需要 1-2 分钟，请耐心等待</span>
                            </div>
                        </Card>
                    ) : isUnlocked && soulSongData ? (
                        <div className={styles.songsGrid}>
                            {soulSongData.songs.map((song, index) => (
                                <Card key={index} className={styles.songCard}>
                                    {/* 封面图 */}
                                    <div className={styles.coverWrapper}>
                                        {song.qqMusic?.coverUrl ? (
                                            <img
                                                src={song.qqMusic.coverUrl}
                                                alt={song.name}
                                                className={styles.coverImage}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className={styles.coverPlaceholder}>
                                                <MusicNotes size={48} weight="duotone" />
                                            </div>
                                        )}
                                        <div className={styles.rankBadge}>#{song.rank}</div>
                                    </div>

                                    {/* 歌曲信息 */}
                                    <div className={styles.songInfo}>
                                        <h3 className={styles.songTitle}>
                                            {song.qqMusic?.title || song.name}
                                        </h3>
                                        <p className={styles.songArtist}>
                                            {song.qqMusic?.singers || song.artist}
                                        </p>
                                        {song.qqMusic?.album && (
                                            <p className={styles.songAlbum}>
                                                专辑：{song.qqMusic.album}
                                            </p>
                                        )}
                                    </div>

                                    {/* 推荐理由 */}
                                    <div className={styles.reasonSection}>
                                        <h4 className={styles.reasonLabel}>为你推荐的理由</h4>
                                        <p className={styles.reasonText}>{song.reason}</p>
                                    </div>

                                    {/* 歌词预览 */}
                                    {song.qqMusic?.lyric && (
                                        <div className={styles.lyricSection}>
                                            <h4 className={styles.lyricLabel}>歌词片段</h4>
                                            <div className={styles.lyricText}>
                                                {song.qqMusic.lyric
                                                    .split('\n')
                                                    .filter(line => line.trim() && !line.startsWith('['))
                                                    .slice(0, 4)
                                                    .map((line, i) => (
                                                        <p key={i}>{line.replace(/\[.*?\]/g, '').trim()}</p>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )}

                                    {/* 二维码 - 直接显示在卡片中 */}
                                    {song.qqMusic?.qrBase64 && (
                                        <div className={styles.qrSection}>
                                            <a
                                                href={song.qqMusic.shareUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.qrLink}
                                            >
                                                <img
                                                    src={song.qqMusic.qrBase64}
                                                    alt="扫码播放"
                                                    className={styles.qrCodeImage}
                                                />
                                            </a>
                                            <p className={styles.qrHint}>扫码或点击播放</p>
                                        </div>
                                    )}

                                    {/* 未找到歌曲提示 */}
                                    {song.error && (
                                        <div className={styles.songError}>
                                            <p>{song.error}</p>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className={styles.contentCard}>
                            <div className={styles.locked}>
                                <div className={styles.lockedIcon}>
                                    <Lock size={32} weight="fill" />
                                </div>
                                <h2 className={styles.lockedTitle}>解锁灵魂歌曲</h2>
                                <p className={styles.lockedDesc}>
                                    基于你的八字命盘，AI 将为你推荐三首与你灵魂频率共振的歌曲。
                                    每一首都蕴含着与你生命底色相呼应的能量。
                                </p>
                                <button
                                    className={styles.unlockButton}
                                    onClick={handleUnlock}
                                    disabled={isUnlocking}
                                >
                                    <Sparkle weight="fill" size={18} />
                                    <span>解锁灵魂歌曲</span>
                                    <span className={styles.unlockPrice}>
                                        <Coins weight="fill" size={16} />
                                        <span>{SOUL_SONG_PRICE}</span>
                                    </span>
                                </button>
                            </div>
                        </Card>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
