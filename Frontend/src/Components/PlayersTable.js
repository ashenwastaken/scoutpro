import React, { useState, useEffect } from "react";
import dummyPlayerImage from "../assets/images/dummy.webp";
import nothingFoundImage from "../assets/images/emptyBox.webp";
import { Link } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";
import bootstrap from "bootstrap/dist/js/bootstrap.bundle.min";
import Loading from "./Loading";

export default function PlayersTable({ players, setMessage, setIsLoading }) {
  const [editPlayer, setEditPlayer] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoadingLocal] = useState(false);
  const playersPerPage = 5;

  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const currentPlayers = players.slice(indexOfFirstPlayer, indexOfLastPlayer);
  const totalPages = Math.ceil(players.length / playersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleNextIndex = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
    return () => {
      if (editPlayer && editPlayer.image) {
        editPlayer.images.forEach((image) => URL.revokeObjectURL(image.url));
      }
    };
  }, [editPlayer.images, editPlayer]);

  const handleDeleteImage = (index) => {
    const updatedImages = [...editPlayer.images];
    updatedImages.splice(index, 1);

    setEditPlayer({
      ...editPlayer,
      images: updatedImages,
    });
  };

  const handleFileChange = async (e, index) => {
    const { files } = e.target;

    const newFiles = Array.from(files).map((file) => ({
      file,
      path: URL.createObjectURL(file),
      fileType: index === 0 ? "mugshot" : "standingshot",
    }));

    setEditPlayer((prevState) => {
      const updatedImages = prevState.images ? [...prevState.images] : [];

      if (updatedImages.length === 0) {
        updatedImages[0] = { fileType: "" };
        updatedImages[1] = { fileType: "" };
      }

      newFiles.forEach((newFile) => {
        if (newFile.fileType === "mugshot") {
          if (updatedImages.length > 0) {
            let temp = updatedImages[0];
            updatedImages[0] = newFile;
            updatedImages[1] = temp;
          } else {
            updatedImages[0] = newFile;
          }
        } else if (newFile.fileType === "standingshot") {
          if (updatedImages.length > 0) {
            let temp = updatedImages[0];
            updatedImages[0] = temp;
            updatedImages[1] = newFile;
          } else {
            updatedImages[1] = newFile;
          }
        }
      });

      return {
        ...prevState,
        images: updatedImages,
      };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditPlayer((prevPlayer) => {
      if (name === "videoUrl1" || name === "videoUrl2") {
        const index = name === "videoUrl1" ? 0 : 1;
        const updatedVideos = [...(prevPlayer.videos || [])];
        updatedVideos[index] = value === "" ? undefined : value;
        return {
          ...prevPlayer,
          videos: updatedVideos,
        };
      }
      return {
        ...prevPlayer,
        [name]: value,
      };
    });
  };

  const handleEdit = (player) => {
    setEditPlayer(player);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const { status, data } = await axiosInstance.put(
        `/player/${editPlayer._id}`,
        editPlayer,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (status === 200) {
        setMessage(data);
        setIsLoading(false);
        const modalElement = document.getElementById("editModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setMessage(error.response.data);
        setIsLoading(true);
      }
    }
  };

  const requestPdf = async (id, playerName) => {
    setIsLoadingLocal(true); // Show the loader
    try {
      const response = await axiosInstance.get(`/generate-pdf/${id}`, {
        responseType: "blob",
      });

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `ScroutPro-${playerName}.pdf`;
      document.body.appendChild(link);
      link.click();

      URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setMessage(error.response.data.error);
      } else {
        console.error("Error downloading PDF:", error);
        setMessage({ error: "An error occurred while downloading the PDF." });
      }
    } finally {
      setIsLoadingLocal(false);
    }
  };

  const handleDeletePlayer = async (id) => {
    try {
      const { status, data } = await axiosInstance.delete(`/player/${id}`);

      if (status === 200) {
        setMessage(data);
        setIsLoading(false);
        setEditPlayer({});
        const modalElement = document.getElementById("editModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setMessage(error.response.data);
        setIsLoading(true);
      }
    }
  };

  return (
    <>
    <Loading isLoading={isLoading} />
      {players.length > 0 ? (
        <>
          <section className="my-4 px-4 playerContainer">
            {currentPlayers.map((player, i) => (
              <div className="playerRow" key={player._id}>
                <div className="playerInfo">
                  <div className="index">{indexOfFirstPlayer + i + 1}.</div>
                  <img
                    alt="Player Profile"
                    src={
                      player.images && player.images.length
                        ? player.images[0].path
                        : dummyPlayerImage
                    }
                    className="playerImage"
                  />
                  <div className="playerDetails">
                    <p className="playerName">{player.playerName}</p>
                    <button
                      data-bs-target="#editModal"
                      data-bs-toggle="modal"
                      className="editPlayerInfoButton"
                      onClick={() => handleEdit(player)}
                    >
                      <svg
                        width="11"
                        height="12"
                        viewBox="0 0 11 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          y="0.5"
                          width="11"
                          height="11"
                          fill="url(#pattern0_132_986)"
                        />
                        <defs>
                          <pattern
                            id="pattern0_132_986"
                            patternContentUnits="objectBoundingBox"
                            width="1"
                            height="1"
                          >
                            <use
                              href="#image0_132_986"
                              transform="scale(0.01)"
                            />
                          </pattern>
                          <image
                            id="image0_132_986"
                            width="100"
                            height="100"
                            href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB5klEQVR4nO3dvUrEQBSG4fEqxC2EZJRtdxL8a6y8KAsLS+/MwlrwEsJJRhDsV+IuYiMaZ5J8kPeF0y0k5GEgwyy7zhEREREREZFkMfirfua+D3I7DAvlW1uV7xZOr3koEhh+uxtQhDBAEcQARRADFEEMUAQxQBHEAEUQA5RsbZ07sMo/pWPspodlR59Yc1EcWlU+50Jh85ghUARrWCl6NaDo1YAyflYfHw35fBvWKwv+hbevEWorX1vlXy2Ud3OtlP51uKtOLt3Sa/cY3x7M5Chg/IAxBwoYv2BMiQLGHzGmQAFjIMaYKGD8E2MMFDASMXKigJH5PCMFBYzsh0sJKKF8ZNPnnOsfQk6Mr6nL26GHXG7pxcwrI3WlLLo4MgYoghgtK0UPAxRBDFAEMfr5vH5Yr9zSiyIY7DMcGFJFVoZOEQydIhg6RTB0AkMoMIQCQygwhAJDKDCEAkMoMIQCQygwhAJDKDCEAkMoMIQCQygwhAJDKDCEAkMoMIQCQygwhGo3xZnCd20j/1SwBwn+fm6Mjl/V0QAxMHRADAwdEANDB8TA0AExMHRADAwdEANDB8TA0AExMHRAwBACAUMIBAwhEDCEQMAQAgEjY92muLHKP6RMVxfnOe+JiIiIiIiIiIiI3OR9AI1gaEIB1ujCAAAAAElFTkSuQmCC"
                          />
                        </defs>
                      </svg>
                      Edit Profile
                    </button>
                  </div>
                </div>
                <div className="playerButtonContainer">
                  <button
                    onClick={() => requestPdf(player._id, player.playerName)}
                    className="exportButton"
                    type="button"
                  >
                    Export profile PDF
                  </button>
                  <Link target="_blank" to={`/player/${player._id}`}>
                    <button type="button" className="playerButton">
                      Open profile link
                    </button>
                  </Link>
                  <button
                    className="deletePlayerButton"
                    onClick={() => handleDeletePlayer(player._id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <img
                      src={require("../assets/icons/delete.png")}
                      alt="Delete"
                      style={{ width: "35px", height: "35px" }}
                    />
                  </button>
                </div>
              </div>
            ))}
          </section>
          <div className="pagination">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`paginationIndex ${
                  currentPage === i + 1 ? "activeIndex" : ""
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={handleNextIndex}
              className="paginationNext"
            >
              Next Page
            </button>
          </div>
        </>
      ) : (
        <section className="my-4 emptyContainer">
          <img
            src={nothingFoundImage}
            alt="No player added"
            className="emptyBox"
          />
          <h2 className="emptyText">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              xlink="http://www.w3.org/1999/xlink"
            >
              <rect
                x="0.5"
                y="0.5"
                width="47"
                height="47"
                fill="url(#pattern0_140_149)"
              />
              <defs>
                <pattern
                  id="pattern0_140_149"
                  patternContentUnits="objectBoundingBox"
                  width="1"
                  height="1"
                >
                  <use href="#image0_140_149" transform="scale(0.01)" />
                </pattern>
                <image
                  id="image0_140_149"
                  width="100"
                  height="100"
                  href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAI9ElEQVR4nO2de4ycVRXAL74pO+fMtqKiKBBjUERI3J1zZmuxvgV8IBr/8BFfETGiAaNEg5jig6jBqMAfhKa67Jw73WZCiJogYMViFNv4tohWjImGinSr1leRPrZrzrdTKevc+91vZnbnfjP3l3z/bLJ37/ede889z7vGJBKJRCKRSCQSiUQikUh0ZNOatRVb4fME6XIB3iRA3xfk31ukPRb43xZ5QZD+ZoHvt8i7LNJtAvwlAbp4BmqTLfPmx6ZP2yMyRmcI0mcs8nZBOqQfvesHeJ8Af72J/L5pPLuahBNI46lnnWCBLrHIP+pJAOh76D+C3GoAvzIJxqOSpMqXWuQHlk8Q3Gnn/KJRpXckldZmwZjj9IMI0tyKCgKXCoZ+2oQ6jfSOseP1F+j5MFBB4COPIB22yNe3Tlw/ZkYNtX5Ul3f98YAeEqCdAnSXIN2qZ4IgbRXkH6r11f643QrmN7pYzChw40kTqwRptosPda8gXdtAeoOtTp2iqs73d6415z5RP6oKXpC2CPLeogK3yO8yw0wT140L0g8KrNQ5Ab6mH6v1RjPxeKny6y3QzUV2jwB/0gwjsmriJFUxgavzT4J0mZrAyzGXWVj7bAHaaJEPBgrm+rwdWSpa4xMowD8P2BGHVC2pCbwS82pW+DkW+Y5QoZhhoHVy/fgwNUW/HsRBumDMcRb5ovaZkbdgLjdlJ+QAF+TGcqmnUBrjk2cuxsC88zyiRoUpt2mbu+o+b8pkdADvayCdZsrp9OX5GfRhE2Usje/MmfeObWb940xZ2GDMY9RBy9kdnzIxx9WQf5Kzsy8zZUEPyZxtP2Mip3HC1FPauRXXO/xj85q1TzdlMHEt8l88Arl30Ad4KM1xXufLw6gxYmJHgK7wCOPg5iqfZUqEBdrgUVuH1ZcxkcepnGF0Af6CKRktc8YTvOYw8FdNrLQzfY6J0+6yhrVthc/z7XoNC5kYscg/HgqrpAMW6W6PGfxRE2NBgkcYc2U5yF00q/XXuVUx/dLERrs6xHV2XFO00kSQmxbpOlupvbZfkdaWWoBAlwjQ9OLDH9CfhfpWFviPrnfcPF57vokJbyo2MGhokT7dKVehWcGZSm1NL/MT5Jd0Njhoj63WXhz4jleXQiUverad7XUB/lXIGAL1D/mdSdrW7U7JwuxA//Q5eZojyRtHTXbP/L5hymCFaH4j7/enzfonZVWHPoEgL0iFXtPV/IBncscGms4bRxeEID3oWHh/V7VmYkDzBK4XDQlXq8rI+2B2Ub1c1+X8On7EJc8DgWNtcY0xMz7xLBMDWmvbyySzXHeYQKSr+SE9nLtDkB7udfEJ0KtMDGjhs0M37w/Zxu3kUK5ABPmqbuaXZSNzVVbgWedZPHoOmhiwSL9zrJidoWPk5dxF8+2VydO7mZ8AfyJAIB/v1d9SK8zEgOeg+17oGNoyoDtqOcpxWifXj/dFEbSwWw2LkLGmV9We1u8zru+4PqRWFBYZR4UiQD9bMsZfLdTe3x+nMLO25o8Z+3DmIK4mKJRR7MFSWxGchWfAt3Qznnq9ma4eq79Io639Tjw1oH6uPq2xdScW/X1N3XrU6qyJAXWsHIfw7WbImMazqx61usnEgIbWHTr1bjNkzI5PPtN5hgB9xcSAy6zUKnQzZAhM1jwC2WBiQJC+5ZjkfKj1Uhakwm93CUQbj0wMWOAvOyc5PnmmGSLEl2ao0jkmBtQs9ZiCF5shQoC/61DPR5pjE082MZA5dW5TcEu/yz0t1N6qUWQt+xSgP6iVl/kUyHsF6T4B+qaGWRpIL+tnheGig+msxvytiQXtYNWaV8fK2avNMr2OL1i7UM3oov3q6lgK8g39qKxvVvh894HON5mY0KZ812Q1H93tuE2sv8IC31NECB7hbO3lTLPImz2q+S0mJvSGBI85eHPh8camnuuMImNPz0H1F7SGrMh8NLziDhHxgdDc/IqR6XaHflX9HpIiPTZVqhm4ZRDGwjEr+q4iJnkT+WPu8eg2EyPamuz5ABvDx6GtyykM+7+FUn9vyHxUcDk3TLzRxIjeHeJ+eT6guYSQcbwFCfioZz7rKdc+QeBbdNVb5D+H75Kw2JMFvtKjjndH3SviuzRGbfiQypGc1rJ5C/wdqdbe6dLb7SqTDa7EWZEelVnkU339h6GJrYFhq3RBzke4KG8MQXpPhx12RMPbRbKG2T0qetFAJysNeN9Nq+vPyC2OQ/q25+zYE31F5mJXK+3wnCUPhZieDeR3a567XR50R6MytbY3PymLJuzS8dSfCfFLclor4iqO8yFYf2HObQm7eq1EXG6aUHu11wkFvqdXh3dF0Ub7HNW1PdbtLjBZE6B/+c6xZqU2ZcqE9oK0LSC3UIDvXKlbGwoJI+eimiLF41HRvo3He0OCdrtqntvEoqbAuzOynV0qVbUUveIo1ycAvl8bLAfaxg10RUjgsgn1t5my43WsHrFYDqnvoPdcreTcGkin+U3b/1s8+y3SS03ZCTjkjwrmPq2mX+75tDS3AXxlyKUzQymUrJQf6IsFXny7hu37XeIvqwk0UBhYET/cQlGym6mRjxR4cW0ju1ojwN027Ohu0ORS1ibnKVcdWaFoOCOkQaeDOnswC59oS0CVLpgZ4+dpre3RdmtNAWjdlJquevhapM8u5sC7umxzezZGngCHRSgatPOFWAb4zKufcdS01Y89MkLRsHV2m7WjFHWlHwHa2ckD1/KeXP8EeL9g7eVmGNBbdfQil17u2rU9PbRHA4U+h2+kdsqSPMbXCtwWutDTA7RbLa7QmNpICkXRu0Ms8kf0hoS+qyXkA5oDbyC/qZtM38gKZUmvyKVZ8Vv3hQ+7tG5KC+z68b9DRl4oj0p+VadO0dx9A+iDFulzGgHIuqD07negjYsVjXxV9h8XqnTOcuVdklAiZOSsrzIgSSjxkYQSIUkoEZKEEiFJKBGShBIhoX6Kdp8Neq4jgw0RCtKOQc9zpLD5QpmPunp+1IQiSHODnt9IYh1C0XqwQc9tZJnJ2seztLU2Gs2pMKK5OHOU2ZbOjEQikUgkEolEIpFImC74L5CYfvf5D9UjAAAAAElFTkSuQmCC"
                />
              </defs>
            </svg>
            No Players Added
          </h2>
          <p className="emptySubHeading">
            Please Upload Your Excel Player List or Add Players Manually
          </p>
        </section>
      )}


      <div
        className="modal fade"
        id="editModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog customWidth modal-dialog-centered">
          <form onSubmit={handleEditSubmit} className="modal-content">
            <div className="modal-header p-0">
              <h1 className="modalTitle" id="exampleModalLabel">
                Edit Player
              </h1>
              <button
                className="btn-close1"
                data-bs-dismiss="modal"
                aria-label="Close"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  x="0px"
                  y="0px"
                  width="30"
                  height="30"
                  viewBox="0 0 50 50"
                >
                  <path d="M 7.71875 6.28125 L 6.28125 7.71875 L 23.5625 25 L 6.28125 42.28125 L 7.71875 43.71875 L 25 26.4375 L 42.28125 43.71875 L 43.71875 42.28125 L 26.4375 25 L 43.71875 7.71875 L 42.28125 6.28125 L 25 23.5625 Z"></path>
                </svg>
              </button>
            </div>
            <div className="modal-body p-0">
              <div className="inputBlock">
                <p className="inputBlockHeading">Player Pictures</p>
                <div className="row g-2">
                  <div className="row g-2">
                    {editPlayer.images &&
                      editPlayer.images.map(
                        (image, index) =>
                          image.path && (
                            <div
                              key={index}
                              className="col-12 col-sm-6 col-md-4 position-relative"
                            >
                              <img
                                src={image.path}
                                alt={`Player Display ${index + 1}`}
                                className="img-fluid"
                              />
                              <button
                                type="button"
                                className="position-absolute top-0 end-0"
                                aria-label="Close"
                                onClick={() => handleDeleteImage(index)}
                                style={{
                                  backgroundColor: "white",
                                  border: "2px solid red",
                                  cursor: "pointer",
                                  padding: "0.2rem",
                                  borderRadius: "50%",
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  x="0px"
                                  y="0px"
                                  width="25"
                                  height="20"
                                  viewBox="0 0 50 50"
                                  fill="red"
                                >
                                  <path d="M 7.71875 6.28125 L 6.28125 7.71875 L 23.5625 25 L 6.28125 42.28125 L 7.71875 43.71875 L 25 26.4375 L 42.28125 43.71875 L 43.71875 42.28125 L 26.4375 25 L 43.71875 7.71875 L 42.28125 6.28125 L 25 23.5625 Z"></path>
                                </svg>
                              </button>
                            </div>
                          )
                      )}

                    {editPlayer.images &&
                      editPlayer.images.every(
                        (img) => img.fileType !== "mugshot"
                      ) && (
                        <div className="col-12 col-sm-6 col-md-4">
                          <label htmlFor="mugShot" className="imageUploadField">
                            <span className="fieldText">Player Mugshot</span>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 18 18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <g clipPath="url(#clip0_198_798)">
                                  <path
                                    d="M18 6.12085C17.9467 6.43709 17.9075 6.75685 17.8375 7.06956C17.5943 8.15701 17.0486 9.07842 16.2655 9.86241C13.9792 12.1514 11.6871 14.4342 9.40608 16.7289C8.93305 17.2046 8.26886 17.0641 8.02882 16.5858C7.87951 16.2876 7.90417 15.996 8.09841 15.7247C8.1561 15.6445 8.22878 15.5745 8.29925 15.504C10.5534 13.249 12.8067 10.9935 15.0631 8.74104C15.6582 8.14732 16.0872 7.45979 16.2532 6.63088C16.5501 5.14747 16.1735 3.84949 15.0909 2.78978C14.195 1.91286 13.0921 1.54817 11.8466 1.65873C10.8529 1.74681 10.0055 2.1692 9.30037 2.87435C6.99994 5.1739 4.69643 7.4708 2.40128 9.77564C1.05926 11.1234 1.56224 13.3199 3.34691 13.8986C4.22912 14.1845 5.03425 13.9977 5.74204 13.3987C5.80458 13.3459 5.86272 13.2877 5.92086 13.2296C8.00151 11.1494 10.0808 9.06785 12.1628 6.9894C12.4134 6.73923 12.5482 6.46087 12.4478 6.10455C12.2905 5.54475 11.6255 5.32453 11.1639 5.67864C11.0943 5.73194 11.0318 5.79448 10.9697 5.85614C9.63071 7.19421 8.29264 8.53359 6.95326 9.87121C6.60046 10.2236 6.14945 10.2636 5.80062 9.98C5.46148 9.70429 5.39761 9.21099 5.65792 8.8604C5.69976 8.80402 5.74821 8.75249 5.79754 8.70272C7.15674 7.34308 8.51418 5.98211 9.87603 4.62555C10.7318 3.77329 11.9474 3.61869 12.953 4.22562C14.2527 5.01005 14.5218 6.83392 13.5044 7.96146C13.4374 8.03545 13.3687 8.10724 13.2983 8.17771C11.2388 10.2377 9.17617 12.2945 7.12106 14.3584C6.40975 15.0733 5.57291 15.5318 4.56738 15.6379C3.40637 15.7608 2.35019 15.4662 1.4627 14.6993C0.26734 13.6656 -0.191161 12.343 0.0717832 10.7878C0.215367 9.9386 0.629824 9.21804 1.23984 8.60891C3.54071 6.3098 5.83938 4.00805 8.14113 1.70982C8.98458 0.867691 9.98658 0.302603 11.1634 0.101321C13.2525 -0.255878 15.0464 0.332553 16.4994 1.88423C17.3821 2.82678 17.8555 3.96136 17.9744 5.24613C17.9789 5.29194 17.9916 5.3373 18.0009 5.38267V6.12129L18 6.12085Z"
                                    fill="#A40F37"
                                  />
                                </g>
                                <defs>
                                  <clipPath id="clip0_198_798">
                                    <rect
                                      width="18"
                                      height="17.0231"
                                      fill="white"
                                    />
                                  </clipPath>
                                </defs>
                              </svg>
                            </svg>
                          </label>
                          <input
                            id="mugShot"
                            name="mugShot"
                            type="file"
                            accept=".png, .jpeg, .jpg"
                            //required
                            className="d-none"
                            onChange={(e) => handleFileChange(e, 0)}
                          />
                        </div>
                      )}

                    {editPlayer.images &&
                      editPlayer.images.every(
                        (img) => img.fileType !== "standingshot"
                      ) && (
                        <div className="col-12 col-sm-6 col-md-4">
                          <label
                            htmlFor="standingShot"
                            className="imageUploadField"
                          >
                            <span className="fieldText">
                              Player Standing Shot
                            </span>
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 18 18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <g clipPath="url(#clip0_198_798)">
                                  <path
                                    d="M18 6.12085C17.9467 6.43709 17.9075 6.75685 17.8375 7.06956C17.5943 8.15701 17.0486 9.07842 16.2655 9.86241C13.9792 12.1514 11.6871 14.4342 9.40608 16.7289C8.93305 17.2046 8.26886 17.0641 8.02882 16.5858C7.87951 16.2876 7.90417 15.996 8.09841 15.7247C8.1561 15.6445 8.22878 15.5745 8.29925 15.504C10.5534 13.249 12.8067 10.9935 15.0631 8.74104C15.6582 8.14732 16.0872 7.45979 16.2532 6.63088C16.5501 5.14747 16.1735 3.84949 15.0909 2.78978C14.195 1.91286 13.0921 1.54817 11.8466 1.65873C10.8529 1.74681 10.0055 2.1692 9.30037 2.87435C6.99994 5.1739 4.69643 7.4708 2.40128 9.77564C1.05926 11.1234 1.56224 13.3199 3.34691 13.8986C4.22912 14.1845 5.03425 13.9977 5.74204 13.3987C5.80458 13.3459 5.86272 13.2877 5.92086 13.2296C8.00151 11.1494 10.0808 9.06785 12.1628 6.9894C12.4134 6.73923 12.5482 6.46087 12.4478 6.10455C12.2905 5.54475 11.6255 5.32453 11.1639 5.67864C11.0943 5.73194 11.0318 5.79448 10.9697 5.85614C9.63071 7.19421 8.29264 8.53359 6.95326 9.87121C6.60046 10.2236 6.14945 10.2636 5.80062 9.98C5.46148 9.70429 5.39761 9.21099 5.65792 8.8604C5.69976 8.80402 5.74821 8.75249 5.79754 8.70272C7.15674 7.34308 8.51418 5.98211 9.87603 4.62555C10.7318 3.77329 11.9474 3.61869 12.953 4.22562C14.2527 5.01005 14.5218 6.83392 13.5044 7.96146C13.4374 8.03545 13.3687 8.10724 13.2983 8.17771C11.2388 10.2377 9.17617 12.2945 7.12106 14.3584C6.40975 15.0733 5.57291 15.5318 4.56738 15.6379C3.40637 15.7608 2.35019 15.4662 1.4627 14.6993C0.26734 13.6656 -0.191161 12.343 0.0717832 10.7878C0.215367 9.9386 0.629824 9.21804 1.23984 8.60891C3.54071 6.3098 5.83938 4.00805 8.14113 1.70982C8.98458 0.867691 9.98658 0.302603 11.1634 0.101321C13.2525 -0.255878 15.0464 0.332553 16.4994 1.88423C17.3821 2.82678 17.8555 3.96136 17.9744 5.24613C17.9789 5.29194 17.9916 5.3373 18.0009 5.38267V6.12129L18 6.12085Z"
                                    fill="#A40F37"
                                  />
                                </g>
                                <defs>
                                  <clipPath id="clip0_198_798">
                                    <rect
                                      width="18"
                                      height="17.0231"
                                      fill="white"
                                    />
                                  </clipPath>
                                </defs>
                              </svg>
                            </svg>
                          </label>
                          <input
                            id="standingShot"
                            name="standingShot"
                            type="file"
                            accept=".png, .jpeg, .jpg"
                            //required
                            className="d-none"
                            onChange={(e) => handleFileChange(e, 1)}
                          />
                        </div>
                      )}
                  </div>
                </div>
              </div>
              <div className="inputBlock">
                <p className="inputBlockHeading">Player Video(s)</p>
                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <input
                      name="videoUrl1"
                      value={editPlayer.videos ? editPlayer.videos[0] : ""}
                      placeholder="Video url"
                      type="text"
                      //required
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <input
                      name="videoUrl2"
                      value={editPlayer.videos ? editPlayer.videos[1] : ""}
                      placeholder="Video url (optional)"
                      type="text"
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <div className="inputBlock">
                <p className="inputBlockHeading">Player Info</p>
                <div className="row g-2">
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="playerName"
                      value={editPlayer.playerName || ""}
                      type="text"
                      //required
                      placeholder="PLAYER NAME"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="playerTeam"
                      value={editPlayer.playerTeam || ""}
                      type="text"
                      //required
                      placeholder="PLAYER TEAM"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="position"
                      value={editPlayer.position || ""}
                      type="text"
                      //required
                      placeholder="POS"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="heightWithShoes"
                      value={editPlayer.heightWithShoes || ""}
                      type="text"
                      //required
                      placeholder="HT. W/ SHOES"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="weight"
                      value={editPlayer.weight || ""}
                      type="text"
                      //required
                      placeholder="WEIGHT"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="bodyFat"
                      value={editPlayer.bodyFat || ""}
                      type="text"
                      //required
                      placeholder="BODY COMP"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="wingSpan"
                      value={editPlayer.wingSpan || ""}
                      type="text"
                      //required
                      placeholder="WINGSPAN"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="standingReach"
                      value={editPlayer.standingReach || ""}
                      type="text"
                      //required
                      placeholder="STANDING REACH"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="handWidth"
                      value={editPlayer.handWidth || ""}
                      type="text"
                      //required
                      placeholder="HAND WIDTH"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="handLength"
                      value={editPlayer.handLength || ""}
                      type="text"
                      //required
                      placeholder="HAND LENGTH"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="standingVert"
                      value={editPlayer.standingVert || ""}
                      type="text"
                      //required
                      placeholder="STANDING VERT"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="maxVert"
                      value={editPlayer.maxVert || ""}
                      type="text"
                      //required
                      placeholder="MAX VERT"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="laneAgility"
                      value={editPlayer.laneAgility || ""}
                      type="text"
                      //required
                      placeholder="LANE AGILITY"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="shuttle"
                      value={editPlayer.shuttle || ""}
                      type="text"
                      //required
                      placeholder="SHUTTLE"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="courtSprint"
                      value={editPlayer.courtSprint || ""}
                      type="text"
                      //required
                      placeholder="3/4 COURT SPRINT"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="maxSpeed"
                      type="text"
                      //required
                      placeholder="MAX SPEED"
                      value={editPlayer.maxSpeed || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="maxJump"
                      type="text"
                      //required
                      placeholder="MAX JUMP HEIGHT"
                      value={editPlayer.maxJump || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="prpp"
                      type="text"
                      //required
                      placeholder="PROPULSIVE POWER"
                      value={editPlayer.prpp || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="acceleration"
                      type="text"
                      //required
                      placeholder="ACCELERATION"
                      value={editPlayer.acceleration || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="deceleration"
                      type="text"
                      //required
                      placeholder="DECELERATION"
                      value={editPlayer.deceleration || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="ttto"
                      type="text"
                      //required
                      placeholder="TAKE OFF"
                      value={editPlayer.ttto || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-md-4">
                    <input
                      name="brakingPhase"
                      type="text"
                      //required
                      placeholder="BRAKING PHASE"
                      value={editPlayer.brakingPhase || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <div className="inputBlock">
                <p className="inputBlockHeading">Player Description</p>
                <div className="textAreWrapper">
                  <textarea
                    name="description"
                    onInput={(e) => {
                      handleInputChange(e);
                    }}
                    value={editPlayer.description || ""}
                    id="description"
                    placeholder="Enter Description"
                    maxLength="500"
                  ></textarea>
                  <div id="wordCount" className="word-count">
                    {editPlayer.description ? editPlayer.description.length : 0}
                    /500 words
                  </div>
                </div>
              </div>
            </div>
            <div className="row g-2">
              <div className="col-12 col-sm-6">
                <button
                  onClick={() => handleDeletePlayer(editPlayer._id)}
                  type="button"
                  className="cancelButton"
                >
                  Delete
                </button>
              </div>
              <div className="col-12 col-sm-6">
                <button type="submit" className="submitButton">
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
