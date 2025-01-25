
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PlayerNav from "./PlayerNav";
import PlayerFooter from "./PlayerFooter";
import dummyPlayerImage from "../assets/images/player.webp";
import pdfImage from "../assets/images/pdfPreview.webp";
import infoIcon from "../assets/icons/info.png";
import axiosInstance from "../services/axiosInstance";
import Loading from "./Loading";

export default function Player() {
    const { id } = useParams();
    const [player, setPlayer] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlayerProfile = async () => {
            try {
                const { status, data } = await axiosInstance.get(`/player/${id}`);
                if (status === 200) {
                    setPlayer(data);
                }
            } catch (error) {
                if (error.response?.data?.error) {
                    alert(error.response.data.error);
                } else if (error.request) {
                    alert("Network error: Please check your internet connection.");
                } else {
                    alert("An error occurred while fetching the player profile.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlayerProfile();
    }, [id]);

    const requestPdf = async (id) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(`/generate-pdf/${id}`, {
                responseType: "blob",
            });

            if (response.status === 200) {
                const pdfBlob = new Blob([response.data], { type: "application/pdf" });
                const downloadUrl = URL.createObjectURL(pdfBlob);

                const link = document.createElement("a");
                link.href = downloadUrl;
                link.download = `ScoutPro-${player.playerName || "Player"}.pdf`;
                document.body.appendChild(link);
                link.click();

                URL.revokeObjectURL(downloadUrl);
                document.body.removeChild(link);
            }
        } catch (error) {
            if (error.response?.data?.error) {
                alert(error.response.data.error);
            } else if (error.request) {
                alert("Network error: Please check your internet connection.");
            } else {
                alert("An error occurred while generating the PDF.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const playerImages = player.images || [];
    const playerVideos = player.videos || [];
    const playerDescription = player.description || "No description available.";
    const validPlayerVideos = playerVideos.filter((url) => url);

    if (!player.images || !player.playerName)
        return <Loading isLoading={isLoading} />;

    return (
        <>
            <PlayerNav player={player} requestPdf={requestPdf} />
            <section className="heroSection">
                <div className="heroBackground">
                    <div className="container no-padding">
                        <div className="row align-items-center justify-content-center mb-5 customHeroTextandImage">
                            <div className="col-12 col-lg-6 d-flex flex-direction-column justify-content-left">
                                <div>
                                    <h1 className="heroPlayerName" data-text={player.playerName}>
                                        {player.playerName || "Player Name"}
                                    </h1>
                                    <div className="heroPlayerWrapper">
                                        <h5 className="infoHeading">Team</h5>
                                        <p className="infoText">{player.playerTeam || "N/A"}</p>
                                    </div>
                                    <div className="heroPlayerWrapper">
                                        <h5 className="infoHeading">Position</h5>
                                        <p className="infoText">{player.position || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 col-lg-6 width-auto">
                                <div className="heroImageWrapper">
                                    <img
                                        alt="Player main display"
                                        src={
                                            playerImages.length > 0
                                                ? playerImages[1].path
                                                : dummyPlayerImage
                                        }
                                        className="heroPlayerImage1"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="allStatsWrapper">
                            <div className="stats-container">
                                <div className="stat">
                                    <span className="stat-label">Weight</span>
                                    <span className="stat-value">{player.weight || "N/A"}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Height</span>
                                    <span className="stat-value">
                      {player.heightWithShoes || "N/A"}
                    </span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">BF</span>
                                    <span className="stat-value">{player.bodyFat || "N/A"}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Wingspan</span>
                                    <span className="stat-value">{player.wingSpan || "N/A"}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Standing Reach</span>
                                    <span className="stat-value">
                      {player.standingReach || "N/A"}
                    </span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Hand Width</span>
                                    <span className="stat-value">{player.handWidth || "N/A"}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label">Hand Length</span>
                                    <span className="stat-value">
                      {player.handLength || "N/A"}
                    </span>
                                </div>

                                <div className="stat row2">
                                    <span className="stat-label">Lane Agility</span>
                                    <span className="stat-value">
                      {player.laneAgility || "N/A"}*
                    </span>
                                </div>
                                <div className="stat row2">
                                    <span className="stat-label">Reactive Shuttle</span>
                                    <span className="stat-value">
                      {player.shuttle || "N/A"}* *
                    </span>
                                </div>
                                <div className="stat row2">
                                    <span className="stat-label">Max Vert</span>
                                    <span className="stat-value">{player.maxVert || "N/A"}</span>
                                </div>
                                <div className="stat row2">
                                    <span className="stat-label">Standing Vert</span>
                                    <span className="stat-value">
                      {player.standingVert || "N/A"}
                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="aboutPlayerSection">
                <div className="row align-items-center aboutPlayerContent">
                    {/* SVG + Image Column */}
                    <div className="col-12 col-lg-6 aboutPlayerSvgWrapper">
                        {/* The absolute-positioned SVG */}
                        <div className="svg-bg-about">
                            <svg
                                width="361"
                                height="503"
                                viewBox="0 0 361 503"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M129.477 159.886H194.984L65.5064 503H0L129.477 159.886Z"
                                    fill="#A40F37"
                                    fillOpacity="0.2"
                                />
                                <path
                                    d="M290.476 0H360.797L221.804 368.205H151.483L290.476 0Z"
                                    fill="#A40F37"
                                    fillOpacity="0.2"
                                />
                                <path
                                    d="M135.666 419.848H209.569L178.095 503H104.448L135.666 419.848Z"
                                    fill="#A40F37"
                                    fillOpacity="0.2"
                                />
                            </svg>
                        </div>

                        <div className="aboutPlayerImageWrapper">
                            <img
                                alt="Player mugshot"
                                src={
                                    playerImages.length > 1 && playerImages[0].path
                                        ? playerImages[0].path
                                        : dummyPlayerImage
                                }
                                className="heroPlayerImage"
                            />
                        </div>
                    </div>
                    <div className="col-12 col-lg-6 mt-5 mt-lg-0 aboutPlayerTextWrapper">
                        <h2 className="playerProfileText">About Player</h2>
                        <p className="playerProfileSubHeading">
                            {playerDescription
                                .split("\n")
                                .filter((sentence) => sentence.trim() !== "")
                                .map((sentence, index, array) => (
                                    <React.Fragment key={index}>
                                        {sentence.trim()}
                                        {index < array.length - 1 && (
                                            <>
                                                <br />
                                                <br />
                                            </>
                                        )}
                                    </React.Fragment>
                                ))}
                        </p>
                    </div>
                </div>
            </section>


            <section className="footageContainer">
                <div className="container text-center">
                    <h2 className="footageHeading">Game Footage and Highlights</h2>
                    <div className="row justify-content-left">
                        {validPlayerVideos.length > 0 ? (
                            validPlayerVideos.map((url, index) => (
                                <div key={index} className="col-12 col-lg">
                                    <iframe
                                        title={`Frame ${index + 1}`}
                                        width="100%"
                                        height="550"
                                        src={url}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            ))
                        ) : (
                            <p className="noVideoText">No video added</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="pdfSection">
                <div className="row align-items-center pdfContent">
                    <div className="col-12 col-lg-5" style={{ fontFamily: "Sansation" , color: "#FFFFFF"}}>
                        <h2>Downloadable PDF</h2>
                        <p className="playerProfileSubHeading">
                            For a comprehensive review, coaches and scouts can download the
                            athlete's detailed profile in PDF format. This downloadable player
                            card includes basic information, key statistics, and any embedded
                            commentary or notes, serving as a valuable resource for evaluations.
                            <br />
                            <br />
                            The PDF offers a quick yet thorough snapshot of the athlete's
                            strengths and achievements, curated for effective evaluation. Note
                            that the content is non-editable once downloaded, ensuring a
                            consistent, professional document for internal or scouting purposes.
                        </p>
                        <button
                            onClick={() => requestPdf(player._id)}
                            className="downloadPdfBtnRed"
                            type="button"
                            disabled={isLoading}
                        >
                            {isLoading ? "Generating PDF..." : "Download Customised PDF"}
                        </button>
                    </div>

                    <div className="col-12 col-lg-6 pdf-preview-wrapper">
                        <div className="svg-bg-pdf">
                            <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 369 514"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                preserveAspectRatio="xMaxYMax meet"
                            >
                                <path
                                    d="M132.622 163.383H199.561L67.2524 514H0.313477L132.622 163.383Z"
                                    fill="#A40F37"
                                    fillOpacity="0.2"
                                />
                                <path
                                    d="M297.142 0H369L226.968 376.258H155.109L297.142 0Z"
                                    fill="#A40F37"
                                    fillOpacity="0.2"
                                />
                                <path
                                    d="M139.005 428.689H214.938L182.384 514H106.451L139.005 428.689Z"
                                    fill="#A40F37"
                                    fillOpacity="0.2"
                                />
                            </svg>
                        </div>
                        <div className="pdfImageWrapper">
                            <div className="overlayWrap">
                                <img src={pdfImage} alt="PDF Display" className="pdfImage"/>
                            </div>
                            <div className="tooltip-wrapper">
                                <img src={infoIcon} alt="Info Icon" className="infoIcon" />
                                <div className="tooltip">
                                    This is a sample PDF. Personalized reports will be generated when
                                    downloaded.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <PlayerFooter />
        </>
    );
}

